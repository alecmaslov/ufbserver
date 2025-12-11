// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 2.0.15
// 

using Colyseus.Schema;
using Action = System.Action;

namespace UFB.StateSchema {
	public partial class Quest : Schema {
		[Type(0, "int32")]
		public int id = default(int);

		[Type(1, "string")]
		public string name = default(string);

		[Type(2, "string")]
		public string description = default(string);

		[Type(3, "int16")]
		public short level = default(short);

		[Type(4, "int32")]
		public int itemId = default(int);

		[Type(5, "int32")]
		public int powerId = default(int);

		[Type(6, "int32")]
		public int melee = default(int);

		[Type(7, "int32")]
		public int mana = default(int);

		[Type(8, "int32")]
		public int coin = default(int);

		[Type(9, "int32")]
		public int target = default(int);

		[Type(10, "int32")]
		public int complete = default(int);

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

		protected event PropertyChangeHandler<int> __itemIdChange;
		public Action OnItemIdChange(PropertyChangeHandler<int> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.itemId));
			__itemIdChange += __handler;
			if (__immediate && this.itemId != default(int)) { __handler(this.itemId, default(int)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(itemId));
				__itemIdChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<int> __powerIdChange;
		public Action OnPowerIdChange(PropertyChangeHandler<int> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.powerId));
			__powerIdChange += __handler;
			if (__immediate && this.powerId != default(int)) { __handler(this.powerId, default(int)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(powerId));
				__powerIdChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<int> __meleeChange;
		public Action OnMeleeChange(PropertyChangeHandler<int> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.melee));
			__meleeChange += __handler;
			if (__immediate && this.melee != default(int)) { __handler(this.melee, default(int)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(melee));
				__meleeChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<int> __manaChange;
		public Action OnManaChange(PropertyChangeHandler<int> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.mana));
			__manaChange += __handler;
			if (__immediate && this.mana != default(int)) { __handler(this.mana, default(int)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(mana));
				__manaChange -= __handler;
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

		protected event PropertyChangeHandler<int> __targetChange;
		public Action OnTargetChange(PropertyChangeHandler<int> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.target));
			__targetChange += __handler;
			if (__immediate && this.target != default(int)) { __handler(this.target, default(int)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(target));
				__targetChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<int> __completeChange;
		public Action OnCompleteChange(PropertyChangeHandler<int> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.complete));
			__completeChange += __handler;
			if (__immediate && this.complete != default(int)) { __handler(this.complete, default(int)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(complete));
				__completeChange -= __handler;
			};
		}

		protected override void TriggerFieldChange(DataChange change) {
			switch (change.Field) {
				case nameof(id): __idChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				case nameof(name): __nameChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(description): __descriptionChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(level): __levelChange?.Invoke((short) change.Value, (short) change.PreviousValue); break;
				case nameof(itemId): __itemIdChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				case nameof(powerId): __powerIdChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				case nameof(melee): __meleeChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				case nameof(mana): __manaChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				case nameof(coin): __coinChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				case nameof(target): __targetChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				case nameof(complete): __completeChange?.Invoke((int) change.Value, (int) change.PreviousValue); break;
				default: break;
			}
		}
	}
}
