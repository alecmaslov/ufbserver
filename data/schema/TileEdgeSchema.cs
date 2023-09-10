// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 2.0.15
// 

using Colyseus.Schema;
using Action = System.Action;

namespace UFB.StateSchema {
	public partial class TileEdgeSchema : Schema {
		[Type(0, "string")]
		public string from = default(string);

		[Type(1, "string")]
		public string to = default(string);

		[Type(2, "string")]
		public string type = default(string);

		[Type(3, "number")]
		public float energyCost = default(float);

		/*
		 * Support for individual property change callbacks below...
		 */

		protected event PropertyChangeHandler<string> __fromChange;
		public Action OnFromChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.from));
			__fromChange += __handler;
			if (__immediate && this.from != default(string)) { __handler(this.from, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(from));
				__fromChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<string> __toChange;
		public Action OnToChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.to));
			__toChange += __handler;
			if (__immediate && this.to != default(string)) { __handler(this.to, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(to));
				__toChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<string> __typeChange;
		public Action OnTypeChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.type));
			__typeChange += __handler;
			if (__immediate && this.type != default(string)) { __handler(this.type, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(type));
				__typeChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<float> __energyCostChange;
		public Action OnEnergyCostChange(PropertyChangeHandler<float> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.energyCost));
			__energyCostChange += __handler;
			if (__immediate && this.energyCost != default(float)) { __handler(this.energyCost, default(float)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(energyCost));
				__energyCostChange -= __handler;
			};
		}

		protected override void TriggerFieldChange(DataChange change) {
			switch (change.Field) {
				case nameof(from): __fromChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(to): __toChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(type): __typeChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(energyCost): __energyCostChange?.Invoke((float) change.Value, (float) change.PreviousValue); break;
				default: break;
			}
		}
	}
}
