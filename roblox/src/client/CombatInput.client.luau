--!strict
-- Les commandes du joueur. ContextActionService crée tout seul les boutons
-- tactiles sur téléphone et gère clavier, souris et manette.
--
--   Frapper : clic gauche · J · bouton X (manette)
--   Boule de feu : K · Q · bouton Y
--   Esquive : L · E · bouton B

local ContextActionService = game:GetService("ContextActionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local CombatConfig = require(Shared:WaitForChild("CombatConfig"))
local Remotes = require(Shared:WaitForChild("Remotes"))

local player = Players.LocalPlayer
local attackRemote = Remotes.get("Attack")
local fireballRemote = Remotes.get("Fireball")
local dashRemote = Remotes.get("Dash")

-- Temps de recharge côté client : uniquement pour l'affichage et éviter d'envoyer
-- des requêtes inutiles. Le serveur revérifie tout de son côté.
local fireReadyAt, dashReadyAt = 0, 0
local holdingAttack = false

local function character(): (Model?, Humanoid?, BasePart?)
	local c = player.Character
	local h = c and c:FindFirstChildOfClass("Humanoid")
	local r = c and c:FindFirstChild("HumanoidRootPart") :: BasePart?
	if c and h and h.Health > 0 and r then
		return c, h, r
	end
	return nil, nil, nil
end

local function onAttack(_: string, state: Enum.UserInputState)
	if state == Enum.UserInputState.Begin then
		holdingAttack = true
		task.spawn(function()
			-- Garder le bouton enfoncé enchaîne le combo automatiquement.
			while holdingAttack and character() do
				attackRemote:FireServer()
				task.wait(0.12)
			end
		end)
	elseif state == Enum.UserInputState.End or state == Enum.UserInputState.Cancel then
		holdingAttack = false
	end
	return Enum.ContextActionResult.Sink
end

local function onFireball(_: string, state: Enum.UserInputState)
	if state ~= Enum.UserInputState.Begin then return Enum.ContextActionResult.Pass end
	if os.clock() < fireReadyAt or not character() then return Enum.ContextActionResult.Sink end
	fireReadyAt = os.clock() + CombatConfig.Fireball.Cooldown
	fireballRemote:FireServer()
	return Enum.ContextActionResult.Sink
end

local function onDash(_: string, state: Enum.UserInputState)
	if state ~= Enum.UserInputState.Begin then return Enum.ContextActionResult.Pass end
	local _, humanoid, root = character()
	if not humanoid or not root or os.clock() < dashReadyAt then return Enum.ContextActionResult.Sink end
	dashReadyAt = os.clock() + CombatConfig.Dash.Cooldown
	dashRemote:FireServer()

	-- Le client possède la physique de son personnage : c'est lui qui déplace.
	local direction = if humanoid.MoveDirection.Magnitude > 0.1 then humanoid.MoveDirection else root.CFrame.LookVector
	direction = Vector3.new(direction.X, 0, direction.Z).Unit
	local attachment = Instance.new("Attachment")
	attachment.Parent = root
	local velocity = Instance.new("LinearVelocity")
	velocity.Attachment0 = attachment
	velocity.MaxForce = math.huge
	velocity.VectorVelocity = direction * CombatConfig.Dash.Speed
	velocity.RelativeTo = Enum.ActuatorRelativeTo.World
	velocity.Parent = root
	task.delay(CombatConfig.Dash.Duration, function()
		velocity:Destroy()
		attachment:Destroy()
	end)
	return Enum.ContextActionResult.Sink
end

ContextActionService:BindAction("Frapper", onAttack, true, Enum.UserInputType.MouseButton1, Enum.KeyCode.J, Enum.KeyCode.ButtonX)
ContextActionService:BindAction("BouleDeFeu", onFireball, true, Enum.KeyCode.K, Enum.KeyCode.Q, Enum.KeyCode.ButtonY)
ContextActionService:BindAction("Esquive", onDash, true, Enum.KeyCode.L, Enum.KeyCode.E, Enum.KeyCode.ButtonB)
ContextActionService:SetTitle("Frapper", "Frapper")
ContextActionService:SetTitle("BouleDeFeu", "Feu")
ContextActionService:SetTitle("Esquive", "Esquive")
ContextActionService:SetPosition("BouleDeFeu", UDim2.new(1, -170, 1, -90))
ContextActionService:SetPosition("Esquive", UDim2.new(1, -95, 1, -170))
