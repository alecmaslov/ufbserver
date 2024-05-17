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
		public string tileCode = default(string);

		[Type(2, "string")]
		public string type = default(string);

		[Type(3, "array", typeof(ArraySchema<byte>), "uint8")]
		public ArraySchema<byte> walls = new ArraySchema<byte>();

		[Type(4, "ref", typeof(CoordinatesState))]
		public CoordinatesState coordinates = new CoordinatesState();

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

		protected event PropertyChangeHandler<string> __tileCodeChange;
		public Action OnTileCodeChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.tileCode));
			__tileCodeChange += __handler;
			if (__immediate && this.tileCode != default(string)) { __handler(this.tileCode, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(tileCode));
				__tileCodeChange -= __handler;
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

		protected event PropertyChangeHandler<ArraySchema<byte>> __wallsChange;
		public Action OnWallsChange(PropertyChangeHandler<ArraySchema<byte>> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.walls));
			__wallsChange += __handler;
			if (__immediate && this.walls != null) { __handler(this.walls, null); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(walls));
				__wallsChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<CoordinatesState> __coordinatesChange;
		public Action OnCoordinatesChange(PropertyChangeHandler<CoordinatesState> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.coordinates));
			__coordinatesChange += __handler;
			if (__immediate && this.coordinates != null) { __handler(this.coordinates, null); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(coordinates));
				__coordinatesChange -= __handler;
			};
		}

		protected override void TriggerFieldChange(DataChange change) {
			switch (change.Field) {
				case nameof(id): __idChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(tileCode): __tileCodeChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(type): __typeChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(walls): __wallsChange?.Invoke((ArraySchema<byte>) change.Value, (ArraySchema<byte>) change.PreviousValue); break;
				case nameof(coordinates): __coordinatesChange?.Invoke((CoordinatesState) change.Value, (CoordinatesState) change.PreviousValue); break;
				default: break;
			}
		}
	}
}
