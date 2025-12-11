// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 2.0.15
// 

using Colyseus.Schema;
using Action = System.Action;

namespace UFB.StateSchema {
	public partial class MoveItemEntity : Schema {
		[Type(0, "string")]
		public string tileId = default(string);

		[Type(1, "string")]
		public string playerId = default(string);

		[Type(2, "number")]
		public float itemId = default(float);

		/*
		 * Support for individual property change callbacks below...
		 */

		protected event PropertyChangeHandler<string> __tileIdChange;
		public Action OnTileIdChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.tileId));
			__tileIdChange += __handler;
			if (__immediate && this.tileId != default(string)) { __handler(this.tileId, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(tileId));
				__tileIdChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<string> __playerIdChange;
		public Action OnPlayerIdChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.playerId));
			__playerIdChange += __handler;
			if (__immediate && this.playerId != default(string)) { __handler(this.playerId, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(playerId));
				__playerIdChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<float> __itemIdChange;
		public Action OnItemIdChange(PropertyChangeHandler<float> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.itemId));
			__itemIdChange += __handler;
			if (__immediate && this.itemId != default(float)) { __handler(this.itemId, default(float)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(itemId));
				__itemIdChange -= __handler;
			};
		}

		protected override void TriggerFieldChange(DataChange change) {
			switch (change.Field) {
				case nameof(tileId): __tileIdChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(playerId): __playerIdChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(itemId): __itemIdChange?.Invoke((float) change.Value, (float) change.PreviousValue); break;
				default: break;
			}
		}
	}
}
