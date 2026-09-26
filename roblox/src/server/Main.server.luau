--!strict
-- Démarre les trois services du serveur, dans cet ordre.
local Server = script.Parent

local PlayerData = require(Server:WaitForChild("PlayerData"))
local CombatService = require(Server:WaitForChild("CombatService"))
local Waves = require(Server:WaitForChild("Waves"))

PlayerData.start()
CombatService.start(PlayerData)
Waves.start(CombatService, PlayerData)
