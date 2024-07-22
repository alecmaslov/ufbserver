// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 2.0.15
// 

using Colyseus.Schema;
using Action = System.Action;

namespace UFB.StateSchema {
	public partial class SpawnEntity : Schema {
		[Type(0, "string")]
		public string id = default(string);

		[Type(1, "string")]
		public string gameId = default(string);

		[Type(2, "string")]
		public string prefabAddress = default(string);

		[Type(3, "string")]
		public string type = default(string);

		[Type(4, "string")]
		public string tileId = default(string);

		[Type(5, "string")]
		public string parameters = default(string);

		/*
		 * Support for individual property change callbacks below...
		 */

		protected event PropertyChangeHandler<string> __idChange;
		public Action OnIdChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.id));
			__idChange += __handler;
			if (__immediate && this.id != default(string)) { __handler(this.id, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(id));
				__idChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<string> __gameIdChange;
		public Action OnGameIdChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.gameId));
			__gameIdChange += __handler;
			if (__immediate && this.gameId != default(string)) { __handler(this.gameId, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(gameId));
				__gameIdChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<string> __prefabAddressChange;
		public Action OnPrefabAddressChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.prefabAddress));
			__prefabAddressChange += __handler;
			if (__immediate && this.prefabAddress != default(string)) { __handler(this.prefabAddress, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(prefabAddress));
				__prefabAddressChange -= __handler;
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

		protected event PropertyChangeHandler<string> __parametersChange;
		public Action OnParametersChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.parameters));
			__parametersChange += __handler;
			if (__immediate && this.parameters != default(string)) { __handler(this.parameters, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(parameters));
				__parametersChange -= __handler;
			};
		}

		protected override void TriggerFieldChange(DataChange change) {
			switch (change.Field) {
				case nameof(id): __idChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(gameId): __gameIdChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(prefabAddress): __prefabAddressChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(type): __typeChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(tileId): __tileIdChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(parameters): __parametersChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				default: break;
			}
		}
	}
}
