// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 2.0.15
// 

using Colyseus.Schema;
using Action = System.Action;

namespace UFB.StateSchema {
	public partial class Item : Schema {
		[Type(0, "int32")]
		public int id = default(int);

		[Type(1, "string")]
		public string name = default(string);

		[Type(2, "string")]
		public string description = default(string);

		[Type(3, "int16")]
		public short count = default(short);

		[Type(4, "int16")]
		public short level = default(short);

		[Type(5, "int16")]
		public short cost = default(short);

		[Type(6, "int16")]
		public short sell = default(short);

		/*
		 * Support for individual property change callbacks below...
		 */

		protected event PropertyChangeHandler<int> __idChange;
		public Action OnIdChange(PropertyChangeHandler<int> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.id));
			__idChange += __handler;
			if (__immediate && this.id != default(int)) { __handler(this.id, default(int)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(id));
				__idChange -= __handler;
			};
		}

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

		protected event PropertyChangeHandler<string> __descriptionChange;
		public Action OnDescriptionChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.description));
			__descriptionChange += __handler;
			if (__immediate && this.description != default(string)) { __handler(this.description, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(description));
				__descriptionChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<short> __countChange;
		public Action OnCountChange(PropertyChangeHandler<short> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.count));
			__countChange += __handler;
			if (__immediate && this.count != default(short)) { __handler(this.count, default(short)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(count));
				__countChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<short> __levelChange;
		public Action OnLevelChange(PropertyChangeHandler<short> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.level));
			__levelChange += __handler;
			if (__immediate && this.level != default(short)) { __handler(this.level, default(short)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(level));
				__levelChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<short> __costChange;
		public Action OnCostChange(PropertyChangeHandler<short> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.cost));
			__costChange += __handler;
			if (__immediate && this.cost != default(short)) { __handler(this.cost, default(short)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(cost));
				__costChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<short> __sellChange;
		public Action OnSellChange(PropertyChangeHandler<short> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.sell));
			__sellChange += __handler;
			if (__immediate && this.sell != default(short)) { __handler(this.sell, default(short)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(sell));
				__sellChange -= __handler;
			};
		}

		protected override void TriggerFieldChange(DataChange change) {
			switch (change.Field) {
				case nameof(id): __idChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				case nameof(name): __nameChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(description): __descriptionChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(count): __countChange?.Invoke((short) change.Value, (short) change.PreviousValue); break;
				case nameof(level): __levelChange?.Invoke((short) change.Value, (short) change.PreviousValue); break;
				case nameof(cost): __costChange?.Invoke((short) change.Value, (short) change.PreviousValue); break;
				case nameof(sell): __sellChange?.Invoke((short) change.Value, (short) change.PreviousValue); break;
				default: break;
			}
		}
	}
}
