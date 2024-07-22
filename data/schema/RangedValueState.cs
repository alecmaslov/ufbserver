// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 2.0.15
// 

using Colyseus.Schema;
using Action = System.Action;

namespace UFB.StateSchema {
	public partial class RangedValueState : Schema {
		[Type(0, "number")]
		public float current = default(float);

		[Type(1, "number")]
		public float max = default(float);

		[Type(2, "number")]
		public float min = default(float);

		/*
		 * Support for individual property change callbacks below...
		 */

		protected event PropertyChangeHandler<float> __currentChange;
		public Action OnCurrentChange(PropertyChangeHandler<float> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.current));
			__currentChange += __handler;
			if (__immediate && this.current != default(float)) { __handler(this.current, default(float)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(current));
				__currentChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<float> __maxChange;
		public Action OnMaxChange(PropertyChangeHandler<float> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.max));
			__maxChange += __handler;
			if (__immediate && this.max != default(float)) { __handler(this.max, default(float)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(max));
				__maxChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<float> __minChange;
		public Action OnMinChange(PropertyChangeHandler<float> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.min));
			__minChange += __handler;
			if (__immediate && this.min != default(float)) { __handler(this.min, default(float)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(min));
				__minChange -= __handler;
			};
		}

		protected override void TriggerFieldChange(DataChange change) {
			switch (change.Field) {
				case nameof(current): __currentChange?.Invoke((float) change.Value, (float) change.PreviousValue); break;
				case nameof(max): __maxChange?.Invoke((float) change.Value, (float) change.PreviousValue); break;
				case nameof(min): __minChange?.Invoke((float) change.Value, (float) change.PreviousValue); break;
				default: break;
			}
		}
	}
}
