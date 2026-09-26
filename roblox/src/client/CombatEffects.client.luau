--!strict
-- Les effets visuels envoyés par le serveur : chiffres de dégâts, explosions,
-- ondes de choc, bannières « VAGUE 2 » et « NIVEAU 3 ».

local Debris = game:GetService("Debris")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Remotes = require(Shared:WaitForChild("Remotes"))

local player = Players.LocalPlayer
local GOLD = Color3.fromRGB(232, 163, 61)
local RED = Color3.fromRGB(255, 90, 56)

local gui = Instance.new("ScreenGui")
gui.Name = "CombatEffects"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.Parent = player:WaitForChild("PlayerGui")

local banner = Instance.new("TextLabel")
banner.AnchorPoint = Vector2.new(0.5, 0.5)
banner.Position = UDim2.fromScale(0.5, 0.3)
banner.Size = UDim2.fromScale(0.8, 0.12)
banner.BackgroundTransparency = 1
banner.Font = Enum.Font.GothamBlack
banner.TextScaled = true
banner.TextColor3 = GOLD
banner.TextStrokeTransparency = 0.4
banner.TextTransparency = 1
banner.Parent = gui

local function showBanner(text: string)
	banner.Text = text
	banner.TextTransparency = 0
	banner.Size = UDim2.fromScale(0.6, 0.09)
	TweenService:Create(banner, TweenInfo.new(0.3, Enum.EasingStyle.Back), { Size = UDim2.fromScale(0.8, 0.12) }):Play()
	task.delay(1.3, function()
		if banner.Text == text then
			TweenService:Create(banner, TweenInfo.new(0.3), { TextTransparency = 1 }):Play()
		end
	end)
end

local function floatingNumber(position: Vector3, amount: number, onPlayer: boolean)
	local anchor = Instance.new("Part")
	anchor.Anchored, anchor.CanCollide, anchor.CanQuery, anchor.Transparency = true, false, false, 1
	anchor.Size = Vector3.one * 0.1
	anchor.Position = position + Vector3.new(math.random(-10, 10) / 10, 0, 0)
	anchor.Parent = workspace

	local billboard = Instance.new("BillboardGui")
	billboard.Size = UDim2.fromOffset(120, 50)
	billboard.AlwaysOnTop = true
	billboard.Parent = anchor
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.GothamBlack
	label.TextScaled = true
	label.Text = if onPlayer then `-{amount}` else tostring(amount)
	label.TextColor3 = if onPlayer then RED else if amount >= 25 then GOLD else Color3.new(1, 1, 1)
	label.TextStrokeTransparency = 0.3
	label.Parent = billboard

	TweenService:Create(anchor, TweenInfo.new(0.8), { Position = anchor.Position + Vector3.new(0, 4, 0) }):Play()
	TweenService:Create(label, TweenInfo.new(0.4, Enum.EasingStyle.Linear, Enum.EasingDirection.In, 0, false, 0.4), { TextTransparency = 1, TextStrokeTransparency = 1 }):Play()
	Debris:AddItem(anchor, 0.9)
end

local function sphereBurst(position: Vector3, radius: number, color: Color3)
	local ball = Instance.new("Part")
	ball.Shape = Enum.PartType.Ball
	ball.Anchored, ball.CanCollide, ball.CanQuery, ball.CastShadow = true, false, false, false
	ball.Material = Enum.Material.Neon
	ball.Color = color
	ball.Size = Vector3.one
	ball.Position = position
	ball.Parent = workspace
	TweenService:Create(ball, TweenInfo.new(0.35, Enum.EasingStyle.Quad), { Size = Vector3.one * radius * 2, Transparency = 1 }):Play()
	Debris:AddItem(ball, 0.4)
end

local function ring(position: Vector3)
	local disc = Instance.new("Part")
	disc.Shape = Enum.PartType.Cylinder
	disc.Anchored, disc.CanCollide, disc.CanQuery, disc.CastShadow = true, false, false, false
	disc.Material = Enum.Material.Neon
	disc.Color = Color3.fromRGB(233, 211, 162)
	disc.Size = Vector3.new(0.2, 1, 1)
	disc.CFrame = CFrame.new(position.X, 0.3, position.Z) * CFrame.Angles(0, 0, math.rad(90))
	disc.Parent = workspace
	TweenService:Create(disc, TweenInfo.new(0.4), { Size = Vector3.new(0.2, 16, 16), Transparency = 1 }):Play()
	Debris:AddItem(disc, 0.45)
end

Remotes.get("Effect").OnClientEvent:Connect(function(kind: string, ...: any)
	if kind == "Damage" then
		local position: Vector3, amount: number, onPlayer: boolean = ...
		floatingNumber(position, amount, onPlayer)
	elseif kind == "Explosion" then
		local position: Vector3, radius: number = ...
		sphereBurst(position, radius, Color3.fromRGB(255, 140, 40))
	elseif kind == "Shockwave" then
		local position: Vector3 = ...
		ring(position)
	elseif kind == "Banner" then
		local text: string = ...
		showBanner(text)
	elseif kind == "LevelUp" then
		local level: number = ...
		showBanner(`NIVEAU {level}`)
	end
end)
