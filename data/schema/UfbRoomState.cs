// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 2.0.15
// 

using Colyseus.Schema;
using Action = System.Action;

namespace UFB.StateSchema {
	public partial class UfbRoomState : Schema {
		[Type(0, "map", typeof(MapSchema<PlayerState>))]
		public MapSchema<PlayerState> players = new MapSchema<PlayerState>();

		[Type(1, "ref", typeof(MapState))]
		public MapState map = new MapState();

		[Type(2, "number")]
		public float turn = default(float);

		[Type(3, "array", typeof(ArraySchema<string>), "string")]
		public ArraySchema<string> turnOrder = new ArraySchema<string>();

		[Type(4, "string")]
		public string currentPlayerId = default(string);

		/*
		 * Support for individual property change callbacks below...
		 */

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

		protected event PropertyChangeHandler<ArraySchema<string>> __turnOrderChange;
		public Action OnTurnOrderChange(PropertyChangeHandler<ArraySchema<string>> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.turnOrder));
			__turnOrderChange += __handler;
			if (__immediate && this.turnOrder != null) { __handler(this.turnOrder, null); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(turnOrder));
				__turnOrderChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<string> __currentPlayerIdChange;
		public Action OnCurrentPlayerIdChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.currentPlayerId));
			__currentPlayerIdChange += __handler;
			if (__immediate && this.currentPlayerId != default(string)) { __handler(this.currentPlayerId, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(currentPlayerId));
				__currentPlayerIdChange -= __handler;
			};
		}

		protected override void TriggerFieldChange(DataChange change) {
			switch (change.Field) {
				case nameof(players): __playersChange?.Invoke((MapSchema<PlayerState>) change.Value, (MapSchema<PlayerState>) change.PreviousValue); break;
				case nameof(map): __mapChange?.Invoke((MapState) change.Value, (MapState) change.PreviousValue); break;
				case nameof(turn): __turnChange?.Invoke((float) change.Value, (float) change.PreviousValue); break;
				case nameof(turnOrder): __turnOrderChange?.Invoke((ArraySchema<string>) change.Value, (ArraySchema<string>) change.PreviousValue); break;
				case nameof(currentPlayerId): __currentPlayerIdChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				default: break;
			}
		}
	}
}
