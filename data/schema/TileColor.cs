// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 2.0.15
// 

using Colyseus.Schema;
using Action = System.Action;

namespace UFB.StateSchema {
	public partial class TileColor : Schema {
		[Type(0, "string")]
		public string name = default(string);

		[Type(1, "string")]
		public string color = default(string);

		/*
		 * Support for individual property change callbacks below...
		 */

		protected event PropertyChangeHandler<string> __nameChange;
		public Action OnNameChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.name));
			__nameChange += __handler;
			if (__immediate && this.name != default(string)) { __handler(this.name, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(name));
				__nameChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<string> __colorChange;
		public Action OnColorChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.color));
			__colorChange += __handler;
			if (__immediate && this.color != default(string)) { __handler(this.color, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(color));
				__colorChange -= __handler;
			};
		}

		protected override void TriggerFieldChange(DataChange change) {
			switch (change.Field) {
				case nameof(name): __nameChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(color): __colorChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				default: break;
			}
		}
	}
}
