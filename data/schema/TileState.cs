// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 2.0.15
// 

using Colyseus.Schema;
using Action = System.Action;

namespace UFB.StateSchema {
	public partial class TileState : Schema {
		[Type(0, "string")]
		public string id = default(string);

		[Type(1, "string")]
		public string type = default(string);

		[Type(2, "string")]
		public string layerName = default(string);

		[Type(3, "string")]
		public string legacyCode = default(string);

		[Type(4, "string")]
		public string color = default(string);

		[Type(5, "number")]
		public float x = default(float);

		[Type(6, "number")]
		public float y = default(float);

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

		protected event PropertyChangeHandler<string> __layerNameChange;
		public Action OnLayerNameChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.layerName));
			__layerNameChange += __handler;
			if (__immediate && this.layerName != default(string)) { __handler(this.layerName, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(layerName));
				__layerNameChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<string> __legacyCodeChange;
		public Action OnLegacyCodeChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.legacyCode));
			__legacyCodeChange += __handler;
			if (__immediate && this.legacyCode != default(string)) { __handler(this.legacyCode, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(legacyCode));
				__legacyCodeChange -= __handler;
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

		protected event PropertyChangeHandler<float> __xChange;
		public Action OnXChange(PropertyChangeHandler<float> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.x));
			__xChange += __handler;
			if (__immediate && this.x != default(float)) { __handler(this.x, default(float)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(x));
				__xChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<float> __yChange;
		public Action OnYChange(PropertyChangeHandler<float> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.y));
			__yChange += __handler;
			if (__immediate && this.y != default(float)) { __handler(this.y, default(float)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(y));
				__yChange -= __handler;
			};
		}

		protected override void TriggerFieldChange(DataChange change) {
			switch (change.Field) {
				case nameof(id): __idChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(type): __typeChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(layerName): __layerNameChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(legacyCode): __legacyCodeChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(color): __colorChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(x): __xChange?.Invoke((float) change.Value, (float) change.PreviousValue); break;
				case nameof(y): __yChange?.Invoke((float) change.Value, (float) change.PreviousValue); break;
				default: break;
			}
		}
	}
}
