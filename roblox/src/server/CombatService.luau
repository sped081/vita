--!strict
-- Le combat, côté serveur. C'est ici que se joue l'anti-triche :
--   * le client envoie seulement « je frappe », « boule de feu », « esquive » ;
--   * le serveur vérifie les temps de recharge, choisit les cibles à partir de
--     SA position du personnage, calcule les dégâts et applique le recul.
-- Un tricheur peut spammer les RemoteEvents : il ne frappera pas plus vite,
-- plus loin ni plus fort que les règles de CombatConfig.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local CombatConfig = require(Shared:WaitForChild("CombatConfig"))
local Remotes = require(Shared:WaitForChild("Remotes"))

type State = {
	combo: number,
	lastAttack: number,
	busyUntil: number,
	fireReadyAt: number,
	dashReadyAt: number,
	invulnerableUntil: number,
}
type PlayerDataApi = {
	damageMultiplier: (Player) -> number,
	addXP: (Player, number) -> (),
}

local CombatService = {}

local states: { [Player]: State } = {}
local effectRemote = Remotes.get("Effect")
local playerData: PlayerDataApi? = nil

local function now(): number
	return os.clock()
end

local function stateOf(player: Player): State
	local s = states[player]
	if not s then
		s = { combo = 0, lastAttack = -math.huge, busyUntil = 0, fireReadyAt = 0, dashReadyAt = 0, invulnerableUntil = 0 }
		states[player] = s
	end
	return s
end

local function rootOf(model: Model?): BasePart?
	if not model then return nil end
	local root = model:FindFirstChild("HumanoidRootPart")
	return if root and root:IsA("BasePart") then root else nil
end

local function aliveHumanoid(model: Model?): Humanoid?
	if not model then return nil end
	local humanoid = model:FindFirstChildOfClass("Humanoid")
	return if humanoid and humanoid.Health > 0 then humanoid else nil
end

local function flat(v: Vector3): Vector3
	local f = Vector3.new(v.X, 0, v.Z)
	return if f.Magnitude > 1e-3 then f.Unit else Vector3.zAxis
end

-- Toutes les cibles vivantes (joueurs ou PNJ) dans un rayon, sauf `ignore`.
local function targetsInRadius(center: Vector3, radius: number, ignore: Model?): { Model }
	local params = OverlapParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	params.FilterDescendantsInstances = if ignore then { ignore } else {}
	local found: { [Model]: boolean } = {}
	local list: { Model } = {}
	for _, part in workspace:GetPartBoundsInRadius(center, radius, params) do
		local model = part:FindFirstAncestorOfClass("Model")
		if model and not found[model] and aliveHumanoid(model) and rootOf(model) then
			found[model] = true
			table.insert(list, model)
		end
	end
	return list
end

local function isFriendlyPair(attacker: Model?, victim: Model): boolean
	-- Pas de JcJ dans cette démo : un joueur ne blesse pas un autre joueur.
	local a = attacker and Players:GetPlayerFromCharacter(attacker)
	local v = Players:GetPlayerFromCharacter(victim)
	return a ~= nil and v ~= nil
end

-- Point d'entrée unique pour infliger des dégâts (utilisé aussi par les bandits).
function CombatService.damage(victim: Model, amount: number, attacker: Model?, knockback: Vector3?)
	local humanoid = aliveHumanoid(victim)
	if not humanoid or isFriendlyPair(attacker, victim) then return end

	local victimPlayer = Players:GetPlayerFromCharacter(victim)
	if victimPlayer and stateOf(victimPlayer).invulnerableUntil > now() then
		return -- l'esquive a évité le coup
	end

	-- Étiquette « creator » : c'est la convention Roblox pour savoir qui a fait le K.O.
	local attackerPlayer = attacker and Players:GetPlayerFromCharacter(attacker)
	if attackerPlayer then
		local existing = victim:FindFirstChild("creator")
		local tag: ObjectValue
		if existing and existing:IsA("ObjectValue") then
			tag = existing
		else
			tag = Instance.new("ObjectValue")
			tag.Name = "creator"
			tag.Parent = victim
		end
		tag.Value = attackerPlayer
	end

	amount = math.round(amount)
	humanoid:TakeDamage(amount)

	local root = rootOf(victim)
	if root then
		if knockback and knockback.Magnitude > 0 then
			root.AssemblyLinearVelocity += knockback + Vector3.new(0, knockback.Magnitude * 0.25, 0)
		end
		effectRemote:FireAllClients("Damage", root.Position + Vector3.new(0, 3, 0), amount, victimPlayer ~= nil)
	end
end

function CombatService.isInvulnerable(player: Player): boolean
	return stateOf(player).invulnerableUntil > now()
end

-- Aide à la visée : tourne l'attaquant vers la cible la plus proche.
local function faceNearest(root: BasePart, character: Model, range: number)
	local best: BasePart? = nil
	local bestDistance = range
	for _, model in targetsInRadius(root.Position, range, character) do
		local r = rootOf(model)
		if r and not Players:GetPlayerFromCharacter(model) then
			local d = (r.Position - root.Position).Magnitude
			if d < bestDistance then
				bestDistance, best = d, r
			end
		end
	end
	if best then
		local look = flat(best.Position - root.Position)
		root.CFrame = CFrame.lookAt(root.Position, root.Position + look)
	end
end

local function onAttack(player: Player)
	local character = player.Character
	local root = rootOf(character)
	if not character or not root or not aliveHumanoid(character) then return end

	local s = stateOf(player)
	local t = now()
	if t < s.busyUntil then return end -- trop tôt : ignoré (anti-spam)

	s.combo = if t - s.lastAttack < CombatConfig.ComboWindow then (s.combo % 3) + 1 else 1
	s.lastAttack = t
	local step = CombatConfig.Combo[s.combo]
	s.busyUntil = t + step.duration

	faceNearest(root, character, CombatConfig.AimAssistRange)
	effectRemote:FireAllClients("Swing", character, s.combo)

	local comboIndex = s.combo
	task.delay(step.hitDelay, function()
		if not aliveHumanoid(character) or not root.Parent then return end
		local forward = flat(root.CFrame.LookVector)
		local multiplier = if playerData then playerData.damageMultiplier(player) else 1
		for _, target in targetsInRadius(root.Position, step.range + 2, character) do
			local targetRoot = rootOf(target)
			if targetRoot then
				local offset = targetRoot.Position - root.Position
				local toTarget = flat(offset)
				local angle = math.deg(math.acos(math.clamp(forward:Dot(toTarget), -1, 1)))
				if step.arcDegrees >= 180 or angle <= step.arcDegrees then
					CombatService.damage(target, step.damage * multiplier, character, toTarget * step.knockback)
				end
			end
		end
		if comboIndex == 3 then
			effectRemote:FireAllClients("Shockwave", root.Position)
		end
	end)
end

local function explode(position: Vector3, owner: Player, character: Model)
	local cfg = CombatConfig.Fireball
	effectRemote:FireAllClients("Explosion", position, cfg.ExplosionRadius)
	local multiplier = if playerData then playerData.damageMultiplier(owner) else 1
	for _, target in targetsInRadius(position, cfg.ExplosionRadius, character) do
		local r = rootOf(target)
		if r then
			CombatService.damage(target, cfg.Damage * multiplier, character, flat(r.Position - position) * cfg.Knockback)
		end
	end
end

local function onFireball(player: Player)
	local character = player.Character
	local root = rootOf(character)
	if not character or not root or not aliveHumanoid(character) then return end

	local s = stateOf(player)
	local t = now()
	if t < s.fireReadyAt then return end
	s.fireReadyAt = t + CombatConfig.Fireball.Cooldown
	s.busyUntil = math.max(s.busyUntil, t + 0.3)

	faceNearest(root, character, 30)
	local direction = flat(root.CFrame.LookVector)
	local cfg = CombatConfig.Fireball

	local ball = Instance.new("Part")
	ball.Name = "Fireball"
	ball.Shape = Enum.PartType.Ball
	ball.Size = Vector3.new(2.4, 2.4, 2.4)
	ball.Material = Enum.Material.Neon
	ball.Color = Color3.fromRGB(255, 140, 40)
	ball.Anchored = true
	ball.CanCollide = false
	ball.CanQuery = false
	ball.CastShadow = false
	local light = Instance.new("PointLight")
	light.Color = ball.Color
	light.Range = 16
	light.Brightness = 3
	light.Parent = ball
	local fire = Instance.new("Fire")
	fire.Heat = 12
	fire.Size = 4
	fire.Parent = ball

	local position = root.Position + direction * 3 + Vector3.new(0, 1.5, 0)
	ball.Position = position
	ball.Parent = workspace

	local rayParams = RaycastParams.new()
	rayParams.FilterType = Enum.RaycastFilterType.Exclude
	rayParams.FilterDescendantsInstances = { character, ball }

	local born = now()
	local connection: RBXScriptConnection
	connection = RunService.Heartbeat:Connect(function(dt)
		local nextPosition = position + direction * cfg.Speed * dt
		local hit = workspace:Raycast(position, nextPosition - position, rayParams)
		-- Une cible proche compte aussi, même si le rayon passe à côté.
		local nearby = #targetsInRadius(nextPosition, 2.5, character) > 0
		if hit or nearby or now() - born > cfg.Lifetime then
			connection:Disconnect()
			local at = if hit then hit.Position else nextPosition
			ball:Destroy()
			explode(at, player, character)
			return
		end
		position = nextPosition
		ball.Position = position
	end)
end

local function onDash(player: Player)
	local character = player.Character
	if not character or not aliveHumanoid(character) then return end
	local s = stateOf(player)
	local t = now()
	if t < s.dashReadyAt then return end
	s.dashReadyAt = t + CombatConfig.Dash.Cooldown
	s.invulnerableUntil = t + CombatConfig.Dash.InvulnerableFor
	s.busyUntil = 0 -- l'esquive annule une attaque en cours
	-- Le déplacement de l'esquive est fait par le client (il possède la physique de
	-- son personnage). Le serveur, lui, décide du temps de recharge et de l'invincibilité.
end

function CombatService.start(data: PlayerDataApi)
	playerData = data
	Remotes.get("Attack").OnServerEvent:Connect(onAttack)
	Remotes.get("Fireball").OnServerEvent:Connect(onFireball)
	Remotes.get("Dash").OnServerEvent:Connect(onDash)
	Players.PlayerRemoving:Connect(function(player)
		states[player] = nil
	end)
end

return CombatService
