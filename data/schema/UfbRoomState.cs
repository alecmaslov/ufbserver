// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 2.0.15
// 

using Colyseus.Schema;
using Action = System.Action;

namespace UFB.Schema {
	public partial class UfbRoomState : Schema {
		[Type(0, "string")]
		public string mapName = default(string);

		[Type(1, "number")]
		public float boardWidth = default(float);

		[Type(2, "number")]
		public float boardHeight = default(float);

		[Type(3, "number")]
		public float turn = default(float);

		[Type(4, "map", typeof(MapSchema<PlayerState>))]
		public MapSchema<PlayerState> players = new MapSchema<PlayerState>();

		[Type(5, "ref", typeof(MapState))]
		public MapState map = new MapState();

		/*
		 * Support for individual property change callbacks below...
		 */

		protected event PropertyChangeHandler<string> __mapNameChange;
		public Action OnMapNameChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.mapName));
			__mapNameChange += __handler;
			if (__immediate && this.mapName != default(string)) { __handler(this.mapName, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(mapName));
				__mapNameChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<float> __boardWidthChange;
		public Action OnBoardWidthChange(PropertyChangeHandler<float> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.boardWidth));
			__boardWidthChange += __handler;
			if (__immediate && this.boardWidth != default(float)) { __handler(this.boardWidth, default(float)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(boardWidth));
				__boardWidthChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<float> __boardHeightChange;
		public Action OnBoardHeightChange(PropertyChangeHandler<float> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.boardHeight));
			__boardHeightChange += __handler;
			if (__immediate && this.boardHeight != default(float)) { __handler(this.boardHeight, default(float)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(boardHeight));
				__boardHeightChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<float> __turnChange;
		public Action OnTurnChange(PropertyChangeHandler<float> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.turn));
			__turnChange += __handler;
			if (__immediate && this.turn != default(float)) { __handler(this.turn, default(float)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(turn));
				__turnChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<MapSchema<PlayerState>> __playersChange;
		public Action OnPlayersChange(PropertyChangeHandler<MapSchema<PlayerState>> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.players));
			__playersChange += __handler;
			if (__immediate && this.players != null) { __handler(this.players, null); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(players));
				__playersChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<MapState> __mapChange;
		public Action OnMapChange(PropertyChangeHandler<MapState> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.map));
			__mapChange += __handler;
			if (__immediate && this.map != null) { __handler(this.map, null); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(map));
				__mapChange -= __handler;
			};
		}

		protected override void TriggerFieldChange(DataChange change) {
			switch (change.Field) {
				case nameof(mapName): __mapNameChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(boardWidth): __boardWidthChange?.Invoke((float) change.Value, (float) change.PreviousValue); break;
				case nameof(boardHeight): __boardHeightChange?.Invoke((float) change.Value, (float) change.PreviousValue); break;
				case nameof(turn): __turnChange?.Invoke((float) change.Value, (float) change.PreviousValue); break;
				case nameof(players): __playersChange?.Invoke((MapSchema<PlayerState>) change.Value, (MapSchema<PlayerState>) change.PreviousValue); break;
				case nameof(map): __mapChange?.Invoke((MapState) change.Value, (MapState) change.PreviousValue); break;
				default: break;
			}
		}
	}
}
