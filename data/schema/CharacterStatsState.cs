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

		protected override void TriggerFieldChange(DataChange change) {
			switch (change.Field) {
				case nameof(health): __healthChange?.Invoke((RangedValueState) change.Value, (RangedValueState) change.PreviousValue); break;
				case nameof(energy): __energyChange?.Invoke((RangedValueState) change.Value, (RangedValueState) change.PreviousValue); break;
				default: break;
			}
		}
	}
}
