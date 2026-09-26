--!strict
-- Les vagues de bandits et le boss, avec la même logique que la démo web :
-- poursuite → préparation (le bandit devient rouge) → coup → récupération.
-- Le Capitaine ajoute une frappe au sol annoncée par un cercle rouge.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local CombatConfig = require(Shared:WaitForChild("CombatConfig"))
local Remotes = require(Shared:WaitForChild("Remotes"))

type CombatApi = {
	damage: (Model, number, Model?, Vector3?) -> (),
}
type PlayerDataApi = {
	addXP: (Player, number) -> (),
}
type Stats = typeof(CombatConfig.Bandit)
type Enemy = {
	model: Model,
	humanoid: Humanoid,
	root: BasePart,
	highlight: Highlight,
	stats: Stats,
	boss: boolean,
	state: "chase" | "windup" | "recover" | "slam",
	timer: number,
	slamCooldown: number,
	slamAt: Vector3?,
	marker: BasePart?,
}

local Waves = {}

local ARENA_CENTER = Vector3.new(0, 3, 0)
local SPAWN_RADIUS = 50
local TICK = 0.1 -- l'IA réfléchit 10 fois par seconde

local enemies: { Enemy } = {}
local effectRemote = Remotes.get("Effect")

local function nearestPlayer(from: Vector3): (Model?, number)
	local best: Model? = nil
	local bestDistance = math.huge
	for _, player in Players:GetPlayers() do
		local character = player.Character
		local humanoid = character and character:FindFirstChildOfClass("Humanoid")
		local root = character and character:FindFirstChild("HumanoidRootPart") :: BasePart?
		if character and humanoid and humanoid.Health > 0 and root then
			local d = (root.Position - from).Magnitude
			if d < bestDistance then
				best, bestDistance = character, d
			end
		end
	end
	return best, bestDistance
end

local function makeRig(boss: boolean): Model
	local description = Instance.new("HumanoidDescription")
	local skin = Color3.fromRGB(217, 164, 124)
	description.HeadColor, description.LeftArmColor, description.RightArmColor = skin, skin, skin
	description.TorsoColor = if boss then Color3.fromRGB(42, 31, 61) else Color3.fromRGB(122, 48, 48)
	local legs = Color3.fromRGB(43, 43, 43)
	description.LeftLegColor, description.RightLegColor = legs, legs
	local model = Players:CreateHumanoidModelFromDescription(description, Enum.HumanoidRigType.R15)
	model.Name = if boss then "Capitaine Sabre-Noir" else "Bandit"
	if boss then
		model:ScaleTo(CombatConfig.Boss.Scale)
	end
	return model
end

local function spawnEnemy(boss: boolean, waveIndex: number, onDeath: () -> ())
	local stats: Stats = if boss then CombatConfig.Boss :: any else CombatConfig.Bandit
	local model = makeRig(boss)
	local humanoid = model:FindFirstChildOfClass("Humanoid") :: Humanoid
	local root = model:FindFirstChild("HumanoidRootPart") :: BasePart

	local health = if boss then stats.Health else stats.Health + CombatConfig.Bandit.HealthPerWave * (waveIndex - 1)
	humanoid.MaxHealth = health
	humanoid.Health = health
	humanoid.WalkSpeed = stats.WalkSpeed
	humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.Viewer
	humanoid.HealthDisplayType = Enum.HumanoidHealthDisplayType.AlwaysOn

	local highlight = Instance.new("Highlight")
	highlight.FillColor = Color3.fromRGB(255, 30, 0)
	highlight.OutlineTransparency = 1
	highlight.FillTransparency = 1
	highlight.Parent = model

	local angle = math.random() * math.pi * 2
	model:PivotTo(CFrame.new(ARENA_CENTER + Vector3.new(math.cos(angle), 0, math.sin(angle)) * SPAWN_RADIUS))
	model.Parent = workspace
	root:SetNetworkOwner(nil) -- le serveur contrôle la physique des PNJ

	local enemy: Enemy = {
		model = model, humanoid = humanoid, root = root, highlight = highlight, stats = stats, boss = boss,
		state = "chase", timer = 0, slamCooldown = 3, slamAt = nil, marker = nil,
	}
	table.insert(enemies, enemy)

	humanoid.Died:Once(function()
		local tag = model:FindFirstChild("creator") :: ObjectValue?
		local killer = tag and tag.Value
		if killer and killer:IsA("Player") and Waves.playerData then
			Waves.playerData.addXP(killer, stats.XP)
		end
		if enemy.marker then enemy.marker:Destroy() end
		local index = table.find(enemies, enemy)
		if index then table.remove(enemies, index) end
		task.delay(3, function() model:Destroy() end)
		onDeath()
	end)
end

local function telegraphMarker(at: Vector3, radius: number): BasePart
	local marker = Instance.new("Part")
	marker.Shape = Enum.PartType.Cylinder
	marker.Size = Vector3.new(0.2, radius * 2, radius * 2)
	marker.CFrame = CFrame.new(at.X, 0.2, at.Z) * CFrame.Angles(0, 0, math.rad(90))
	marker.Anchored = true
	marker.CanCollide = false
	marker.CanQuery = false
	marker.Material = Enum.Material.Neon
	marker.Color = Color3.fromRGB(230, 57, 23)
	marker.Transparency = 0.7
	marker.Parent = workspace
	return marker
end

local function think(enemy: Enemy, dt: number, combat: CombatApi)
	local stats = enemy.stats
	local target, distance = nearestPlayer(enemy.root.Position)
	local targetRoot = target and target:FindFirstChild("HumanoidRootPart") :: BasePart?

	if enemy.state == "chase" then
		enemy.highlight.FillTransparency = 1
		if not target or not targetRoot then
			enemy.humanoid:MoveTo(enemy.root.Position)
			return
		end
		if distance > stats.Reach * 0.85 then
			enemy.humanoid:MoveTo(targetRoot.Position)
		else
			enemy.humanoid:MoveTo(enemy.root.Position)
			enemy.state, enemy.timer = "windup", stats.Windup
		end
		if enemy.boss then
			local slam = CombatConfig.Boss.Slam
			enemy.slamCooldown -= dt
			if enemy.slamCooldown <= 0 and distance < slam.TriggerRange then
				enemy.state, enemy.timer = "slam", slam.Telegraph
				enemy.slamAt = targetRoot.Position
				enemy.marker = telegraphMarker(targetRoot.Position, slam.Radius)
				enemy.humanoid:MoveTo(enemy.root.Position)
			end
		end

	elseif enemy.state == "windup" then
		-- Le bandit clignote en rouge : c'est le signal pour esquiver.
		enemy.highlight.FillTransparency = 0.35 + 0.3 * math.sin(os.clock() * 30)
		if targetRoot then
			enemy.root.CFrame = CFrame.lookAt(enemy.root.Position, Vector3.new(targetRoot.Position.X, enemy.root.Position.Y, targetRoot.Position.Z))
		end
		enemy.timer -= dt
		if enemy.timer <= 0 then
			if target and targetRoot and distance <= stats.Reach + 1.5 then
				local push = (targetRoot.Position - enemy.root.Position) * Vector3.new(1, 0, 1)
				combat.damage(target, stats.Damage, enemy.model, if push.Magnitude > 0 then push.Unit * 40 else nil)
			end
			enemy.state, enemy.timer = "recover", stats.Recover
			enemy.highlight.FillTransparency = 1
		end

	elseif enemy.state == "recover" then
		enemy.timer -= dt
		if enemy.timer <= 0 then enemy.state = "chase" end

	elseif enemy.state == "slam" then
		local slam = CombatConfig.Boss.Slam
		enemy.highlight.FillTransparency = 0.35 + 0.3 * math.sin(os.clock() * 30)
		enemy.timer -= dt
		if enemy.marker then
			enemy.marker.Transparency = 0.7 - 0.4 * (1 - enemy.timer / slam.Telegraph)
		end
		if enemy.timer <= 0 then
			local at = enemy.slamAt :: Vector3
			effectRemote:FireAllClients("Shockwave", at)
			for _, player in Players:GetPlayers() do
				local character = player.Character
				local r = character and character:FindFirstChild("HumanoidRootPart") :: BasePart?
				if character and r and ((r.Position - at) * Vector3.new(1, 0, 1)).Magnitude <= slam.Radius then
					combat.damage(character, slam.Damage, enemy.model, Vector3.new(0, 30, 0))
				end
			end
			if enemy.marker then enemy.marker:Destroy() end
			enemy.marker, enemy.slamAt = nil, nil
			enemy.slamCooldown = slam.Cooldown
			enemy.state, enemy.timer = "recover", 0.9
			enemy.highlight.FillTransparency = 1
		end
	end
end

Waves.playerData = nil :: PlayerDataApi?

function Waves.start(combat: CombatApi, playerData: PlayerDataApi)
	Waves.playerData = playerData

	local accumulator = 0
	RunService.Heartbeat:Connect(function(dt)
		accumulator += dt
		if accumulator < TICK then return end
		local step = accumulator
		accumulator = 0
		for _, enemy in table.clone(enemies) do
			if enemy.humanoid.Health > 0 then
				think(enemy, step, combat)
			end
		end
	end)

	task.spawn(function()
		-- On attend le premier joueur, puis on enchaîne les vagues en boucle.
		while #Players:GetPlayers() == 0 do task.wait(1) end
		while true do
			for waveIndex, wave in CombatConfig.Waves do
				effectRemote:FireAllClients("Banner", if wave.boss then "LE CAPITAINE" else `VAGUE {waveIndex}`)
				task.wait(2)
				local alive = 0
				local function onDeath() alive -= 1 end
				for _ = 1, wave.bandits do
					alive += 1
					spawnEnemy(false, waveIndex, onDeath)
					task.wait(0.25)
				end
				if wave.boss then
					alive += 1
					spawnEnemy(true, waveIndex, onDeath)
				end
				while alive > 0 do task.wait(0.5) end
				task.wait(2)
			end
			effectRemote:FireAllClients("Banner", "VICTOIRE !")
			task.wait(6)
		end
	end)
end

return Waves
