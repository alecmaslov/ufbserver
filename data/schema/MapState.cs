// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 2.0.15
// 

using Colyseus.Schema;
using Action = System.Action;

namespace UFB.StateSchema {
	public partial class MapState : Schema {
		[Type(0, "string")]
		public string id = default(string);

		[Type(1, "string")]
		public string name = default(string);

		[Type(2, "number")]
		public float gridWidth = default(float);

		[Type(3, "number")]
		public float gridHeight = default(float);

		[Type(4, "map", typeof(MapSchema<TileState>))]
		public MapSchema<TileState> tiles = new MapSchema<TileState>();

		[Type(5, "map", typeof(MapSchema<AdjacencyListItem>))]
		public MapSchema<AdjacencyListItem> adjacencyList = new MapSchema<AdjacencyListItem>();

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

		protected event PropertyChangeHandler<float> __gridWidthChange;
		public Action OnGridWidthChange(PropertyChangeHandler<float> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.gridWidth));
			__gridWidthChange += __handler;
			if (__immediate && this.gridWidth != default(float)) { __handler(this.gridWidth, default(float)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(gridWidth));
				__gridWidthChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<float> __gridHeightChange;
		public Action OnGridHeightChange(PropertyChangeHandler<float> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.gridHeight));
			__gridHeightChange += __handler;
			if (__immediate && this.gridHeight != default(float)) { __handler(this.gridHeight, default(float)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(gridHeight));
				__gridHeightChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<MapSchema<TileState>> __tilesChange;
		public Action OnTilesChange(PropertyChangeHandler<MapSchema<TileState>> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.tiles));
			__tilesChange += __handler;
			if (__immediate && this.tiles != null) { __handler(this.tiles, null); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(tiles));
				__tilesChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<MapSchema<AdjacencyListItem>> __adjacencyListChange;
		public Action OnAdjacencyListChange(PropertyChangeHandler<MapSchema<AdjacencyListItem>> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.adjacencyList));
			__adjacencyListChange += __handler;
			if (__immediate && this.adjacencyList != null) { __handler(this.adjacencyList, null); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(adjacencyList));
				__adjacencyListChange -= __handler;
			};
		}

		protected override void TriggerFieldChange(DataChange change) {
			switch (change.Field) {
				case nameof(id): __idChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(name): __nameChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(gridWidth): __gridWidthChange?.Invoke((float) change.Value, (float) change.PreviousValue); break;
				case nameof(gridHeight): __gridHeightChange?.Invoke((float) change.Value, (float) change.PreviousValue); break;
				case nameof(tiles): __tilesChange?.Invoke((MapSchema<TileState>) change.Value, (MapSchema<TileState>) change.PreviousValue); break;
				case nameof(adjacencyList): __adjacencyListChange?.Invoke((MapSchema<AdjacencyListItem>) change.Value, (MapSchema<AdjacencyListItem>) change.PreviousValue); break;
				default: break;
			}
		}
	}
}
