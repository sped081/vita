--!strict
-- Sauvegarde du niveau, de l'XP et des pièces avec DataStoreService.
--
-- Règle d'or : si le chargement échoue, on NE sauvegarde PAS. Sinon on écraserait
-- la vraie progression du joueur par des valeurs par défaut.

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local CombatConfig = require(Shared:WaitForChild("CombatConfig"))
local Remotes = require(Shared:WaitForChild("Remotes"))

type Data = { level: number, xp: number, coins: number }
type Profile = { data: Data, loaded: boolean, dirty: boolean }

local STORE_NAME = "IleDesBandits_PlayerData_v1"
local AUTOSAVE_EVERY = 120
local MAX_ATTEMPTS = 4

local store = DataStoreService:GetDataStore(STORE_NAME)
local profiles: { [Player]: Profile } = {}
local effectRemote = Remotes.get("Effect")

local PlayerData = {}

local function defaultData(): Data
	return { level = 1, xp = 0, coins = 0 }
end

-- Réessaie une opération DataStore avec un délai croissant (1 s, 2 s, 4 s…).
local function withRetries<T>(label: string, fn: () -> T): (boolean, T?)
	for attempt = 1, MAX_ATTEMPTS do
		local ok, result = pcall(fn)
		if ok then
			return true, result
		end
		warn(`[PlayerData] {label} : échec {attempt}/{MAX_ATTEMPTS} : {result}`)
		if attempt < MAX_ATTEMPTS then
			task.wait(2 ^ (attempt - 1))
		end
	end
	return false, nil
end

local function sanitize(raw: any): Data
	local data = defaultData()
	if type(raw) == "table" then
		if type(raw.level) == "number" then data.level = math.clamp(math.floor(raw.level), 1, 1000) end
		if type(raw.xp) == "number" then data.xp = math.max(0, math.floor(raw.xp)) end
		if type(raw.coins) == "number" then data.coins = math.max(0, math.floor(raw.coins)) end
	end
	return data
end

local function updateLeaderstats(player: Player, data: Data)
	local stats = player:FindFirstChild("leaderstats")
	if not stats then return end
	(stats:FindFirstChild("Niveau") :: IntValue).Value = data.level;
	(stats:FindFirstChild("Pièces") :: IntValue).Value = data.coins
end

function PlayerData.maxHealth(level: number): number
	return CombatConfig.Player.BaseHealth + CombatConfig.Player.HealthPerLevel * (level - 1)
end

function PlayerData.damageMultiplier(player: Player): number
	local profile = profiles[player]
	local level = if profile then profile.data.level else 1
	return 1 + CombatConfig.Player.DamagePerLevel * (level - 1)
end

local function applyHealth(player: Player)
	local profile = profiles[player]
	local character = player.Character
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if profile and humanoid then
		humanoid.MaxHealth = PlayerData.maxHealth(profile.data.level)
		humanoid.Health = humanoid.MaxHealth
	end
end

function PlayerData.addXP(player: Player, amount: number)
	local profile = profiles[player]
	if not profile or amount <= 0 then return end
	local data = profile.data
	data.xp += amount
	local leveledUp = false
	while data.xp >= CombatConfig.XPForLevel(data.level) do
		data.xp -= CombatConfig.XPForLevel(data.level)
		data.level += 1
		leveledUp = true
	end
	data.coins += math.floor(amount / 5)
	profile.dirty = true
	updateLeaderstats(player, data)
	effectRemote:FireClient(player, "XP", amount, data.xp, CombatConfig.XPForLevel(data.level))
	if leveledUp then
		applyHealth(player)
		effectRemote:FireClient(player, "LevelUp", data.level)
	end
end

local function save(player: Player)
	local profile = profiles[player]
	if not profile or not profile.loaded or not profile.dirty then return end
	local snapshot = table.clone(profile.data)
	local ok = withRetries(`sauvegarde de {player.UserId}`, function()
		store:UpdateAsync(tostring(player.UserId), function()
			return snapshot
		end)
		return true
	end)
	if ok then profile.dirty = false end
end

local function onPlayerAdded(player: Player)
	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"
	for _, name in { "Niveau", "Pièces" } do
		local value = Instance.new("IntValue")
		value.Name = name
		value.Parent = stats
	end
	stats.Parent = player

	local ok, raw = withRetries(`chargement de {player.UserId}`, function()
		return store:GetAsync(tostring(player.UserId))
	end)
	if not player.Parent then return end -- parti pendant le chargement

	local profile: Profile = { data = if ok then sanitize(raw) else defaultData(), loaded = ok, dirty = false }
	profiles[player] = profile
	if not ok then
		warn(`[PlayerData] Données indisponibles pour {player.Name} : la progression de cette session ne sera pas sauvegardée.`)
	end
	updateLeaderstats(player, profile.data)

	player.CharacterAdded:Connect(function()
		task.defer(applyHealth, player)
	end)
	if player.Character then applyHealth(player) end
end

function PlayerData.start()
	Players.PlayerAdded:Connect(onPlayerAdded)
	for _, player in Players:GetPlayers() do
		task.spawn(onPlayerAdded, player)
	end

	Players.PlayerRemoving:Connect(function(player)
		save(player)
		profiles[player] = nil
	end)

	task.spawn(function()
		while true do
			task.wait(AUTOSAVE_EVERY)
			for player in profiles do
				task.spawn(save, player)
			end
		end
	end)

	-- À la fermeture du serveur, on sauvegarde tout le monde en parallèle.
	game:BindToClose(function()
		local pending = 0
		for player in profiles do
			pending += 1
			task.spawn(function()
				save(player)
				pending -= 1
			end)
		end
		local deadline = os.clock() + 25
		while pending > 0 and os.clock() < deadline do
			task.wait(0.1)
		end
	end)
end

return PlayerData
