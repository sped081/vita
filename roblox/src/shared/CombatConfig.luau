--!strict
-- Tous les réglages de combat au même endroit.
-- Ce sont exactement les valeurs de la démo web (demo/ile-des-bandits.html).

export type ComboStep = { damage: number, range: number, arcDegrees: number, knockback: number, duration: number, hitDelay: number }

local CombatConfig = {
	Player = {
		BaseHealth = 120,
		HealthPerLevel = 20,
		DamagePerLevel = 0.2, -- +20 % de dégâts par niveau
	},

	Combo = {
		{ damage = 12, range = 2.7 * 2, arcDegrees = 65, knockback = 30, duration = 0.30, hitDelay = 0.09 },
		{ damage = 12, range = 2.7 * 2, arcDegrees = 65, knockback = 30, duration = 0.30, hitDelay = 0.09 },
		{ damage = 26, range = 3.3 * 2, arcDegrees = 180, knockback = 70, duration = 0.50, hitDelay = 0.18 },
	} :: { ComboStep },
	ComboWindow = 0.9, -- secondes pour enchaîner le coup suivant
	AimAssistRange = 10, -- studs : le serveur tourne l'attaquant vers l'ennemi le plus proche

	Fireball = {
		Cooldown = 4,
		Damage = 38,
		Speed = 60, -- studs par seconde
		Lifetime = 1.3,
		ExplosionRadius = 8.5,
		Knockback = 60,
	},

	Dash = {
		Cooldown = 2.5,
		Duration = 0.2,
		Speed = 80,
		InvulnerableFor = 0.32,
	},

	Bandit = { Health = 60, HealthPerWave = 15, Damage = 9, WalkSpeed = 14, Reach = 5, Windup = 0.5, Recover = 0.8, XP = 35 },
	Boss = {
		Health = 560, Damage = 18, WalkSpeed = 12, Reach = 7, Windup = 0.7, Recover = 0.6, XP = 250, Scale = 1.65,
		Slam = { Cooldown = 5, Telegraph = 1.1, Radius = 8, Damage = 28, TriggerRange = 22 },
	},

	Waves = {
		{ bandits = 3, boss = false },
		{ bandits = 5, boss = false },
		{ bandits = 2, boss = true },
	},

	-- Même courbe que la démo : il faut 50 + niveau × 50 XP pour monter.
	XPForLevel = function(level: number): number
		return 50 + level * 50
	end,

	-- Identifiants d'animations (optionnels). Laissez vide pour jouer sans animation.
	Animations = {
		Punch1 = "",
		Punch2 = "",
		Spin = "",
		Cast = "",
	},
}

return CombatConfig
