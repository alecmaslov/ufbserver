// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 2.0.15
// 

using Colyseus.Schema;
using Action = System.Action;

namespace UFB.StateSchema {
	public partial class CharacterStatsState : Schema {
		[Type(0, "ref", typeof(RangedValueState))]
		public RangedValueState health = new RangedValueState();

		[Type(1, "ref", typeof(RangedValueState))]
		public RangedValueState energy = new RangedValueState();

		[Type(2, "ref", typeof(RangedValueState))]
		public RangedValueState ultimate = new RangedValueState();

		[Type(3, "boolean")]
		public bool isRevive = default(bool);

		[Type(4, "int32")]
		public int coin = default(int);

		[Type(5, "int32")]
		public int range = default(int);

		[Type(6, "int32")]
		public int bags = default(int);

		[Type(7, "int32")]
		public int itemBox = default(int);

		[Type(8, "int32")]
		public int damage_taken = default(int);

		[Type(9, "int32")]
		public int used_energy = default(int);

		[Type(10, "int32")]
		public int damage_deal = default(int);

		[Type(11, "int32")]
		public int used_stack = default(int);

		[Type(12, "int32")]
		public int damage_heal = default(int);

		[Type(13, "int32")]
		public int traveled_tile = default(int);

		[Type(14, "int32")]
		public int kills = default(int);

		[Type(15, "int16")]
		public short arrowLimit = default(short);

		[Type(16, "int16")]
		public short bombLimit = default(short);

		[Type(17, "int8")]
		public sbyte maxMelee = default(sbyte);

		[Type(18, "int8")]
		public sbyte maxMana = default(sbyte);

		/*
		 * Support for individual property change callbacks below...
		 */

		protected event PropertyChangeHandler<RangedValueState> __healthChange;
		public Action OnHealthChange(PropertyChangeHandler<RangedValueState> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.health));
			__healthChange += __handler;
			if (__immediate && this.health != null) { __handler(this.health, null); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(health));
				__healthChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<RangedValueState> __energyChange;
		public Action OnEnergyChange(PropertyChangeHandler<RangedValueState> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.energy));
			__energyChange += __handler;
			if (__immediate && this.energy != null) { __handler(this.energy, null); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(energy));
				__energyChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<RangedValueState> __ultimateChange;
		public Action OnUltimateChange(PropertyChangeHandler<RangedValueState> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.ultimate));
			__ultimateChange += __handler;
			if (__immediate && this.ultimate != null) { __handler(this.ultimate, null); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(ultimate));
				__ultimateChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<bool> __isReviveChange;
		public Action OnIsReviveChange(PropertyChangeHandler<bool> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.isRevive));
			__isReviveChange += __handler;
			if (__immediate && this.isRevive != default(bool)) { __handler(this.isRevive, default(bool)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(isRevive));
				__isReviveChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<int> __coinChange;
		public Action OnCoinChange(PropertyChangeHandler<int> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.coin));
			__coinChange += __handler;
			if (__immediate && this.coin != default(int)) { __handler(this.coin, default(int)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(coin));
				__coinChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<int> __rangeChange;
		public Action OnRangeChange(PropertyChangeHandler<int> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.range));
			__rangeChange += __handler;
			if (__immediate && this.range != default(int)) { __handler(this.range, default(int)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(range));
				__rangeChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<int> __bagsChange;
		public Action OnBagsChange(PropertyChangeHandler<int> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.bags));
			__bagsChange += __handler;
			if (__immediate && this.bags != default(int)) { __handler(this.bags, default(int)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(bags));
				__bagsChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<int> __itemBoxChange;
		public Action OnItemBoxChange(PropertyChangeHandler<int> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.itemBox));
			__itemBoxChange += __handler;
			if (__immediate && this.itemBox != default(int)) { __handler(this.itemBox, default(int)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(itemBox));
				__itemBoxChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<int> __damage_takenChange;
		public Action OnDamage_takenChange(PropertyChangeHandler<int> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.damage_taken));
			__damage_takenChange += __handler;
			if (__immediate && this.damage_taken != default(int)) { __handler(this.damage_taken, default(int)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(damage_taken));
				__damage_takenChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<int> __used_energyChange;
		public Action OnUsed_energyChange(PropertyChangeHandler<int> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.used_energy));
			__used_energyChange += __handler;
			if (__immediate && this.used_energy != default(int)) { __handler(this.used_energy, default(int)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(used_energy));
				__used_energyChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<int> __damage_dealChange;
		public Action OnDamage_dealChange(PropertyChangeHandler<int> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.damage_deal));
			__damage_dealChange += __handler;
			if (__immediate && this.damage_deal != default(int)) { __handler(this.damage_deal, default(int)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(damage_deal));
				__damage_dealChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<int> __used_stackChange;
		public Action OnUsed_stackChange(PropertyChangeHandler<int> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.used_stack));
			__used_stackChange += __handler;
			if (__immediate && this.used_stack != default(int)) { __handler(this.used_stack, default(int)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(used_stack));
				__used_stackChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<int> __damage_healChange;
		public Action OnDamage_healChange(PropertyChangeHandler<int> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.damage_heal));
			__damage_healChange += __handler;
			if (__immediate && this.damage_heal != default(int)) { __handler(this.damage_heal, default(int)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(damage_heal));
				__damage_healChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<int> __traveled_tileChange;
		public Action OnTraveled_tileChange(PropertyChangeHandler<int> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.traveled_tile));
			__traveled_tileChange += __handler;
			if (__immediate && this.traveled_tile != default(int)) { __handler(this.traveled_tile, default(int)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(traveled_tile));
				__traveled_tileChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<int> __killsChange;
		public Action OnKillsChange(PropertyChangeHandler<int> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.kills));
			__killsChange += __handler;
			if (__immediate && this.kills != default(int)) { __handler(this.kills, default(int)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(kills));
				__killsChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<short> __arrowLimitChange;
		public Action OnArrowLimitChange(PropertyChangeHandler<short> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.arrowLimit));
			__arrowLimitChange += __handler;
			if (__immediate && this.arrowLimit != default(short)) { __handler(this.arrowLimit, default(short)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(arrowLimit));
				__arrowLimitChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<short> __bombLimitChange;
		public Action OnBombLimitChange(PropertyChangeHandler<short> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.bombLimit));
			__bombLimitChange += __handler;
			if (__immediate && this.bombLimit != default(short)) { __handler(this.bombLimit, default(short)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(bombLimit));
				__bombLimitChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<sbyte> __maxMeleeChange;
		public Action OnMaxMeleeChange(PropertyChangeHandler<sbyte> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.maxMelee));
			__maxMeleeChange += __handler;
			if (__immediate && this.maxMelee != default(sbyte)) { __handler(this.maxMelee, default(sbyte)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(maxMelee));
				__maxMeleeChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<sbyte> __maxManaChange;
		public Action OnMaxManaChange(PropertyChangeHandler<sbyte> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.maxMana));
			__maxManaChange += __handler;
			if (__immediate && this.maxMana != default(sbyte)) { __handler(this.maxMana, default(sbyte)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(maxMana));
				__maxManaChange -= __handler;
			};
		}

		protected override void TriggerFieldChange(DataChange change) {
			switch (change.Field) {
				case nameof(health): __healthChange?.Invoke((RangedValueState) change.Value, (RangedValueState) change.PreviousValue); break;
				case nameof(energy): __energyChange?.Invoke((RangedValueState) change.Value, (RangedValueState) change.PreviousValue); break;
				case nameof(ultimate): __ultimateChange?.Invoke((RangedValueState) change.Value, (RangedValueState) change.PreviousValue); break;
				case nameof(isRevive): __isReviveChange?.Invoke((bool) change.Value, (bool) change.PreviousValue); break;
				case nameof(coin): __coinChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				case nameof(range): __rangeChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				case nameof(bags): __bagsChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				case nameof(itemBox): __itemBoxChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				case nameof(damage_taken): __damage_takenChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				case nameof(used_energy): __used_energyChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				case nameof(damage_deal): __damage_dealChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				case nameof(used_stack): __used_stackChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				case nameof(damage_heal): __damage_healChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				case nameof(traveled_tile): __traveled_tileChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				case nameof(kills): __killsChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				case nameof(arrowLimit): __arrowLimitChange?.Invoke((short) change.Value, (short) change.PreviousValue); break;
				case nameof(bombLimit): __bombLimitChange?.Invoke((short) change.Value, (short) change.PreviousValue); break;
				case nameof(maxMelee): __maxMeleeChange?.Invoke((sbyte) change.Value, (sbyte) change.PreviousValue); break;
				case nameof(maxMana): __maxManaChange?.Invoke((sbyte) change.Value, (sbyte) change.PreviousValue); break;
				default: break;
			}
		}
	}
}
