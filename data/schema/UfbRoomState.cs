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
		[Type(0, "map", typeof(MapSchema<CharacterState>))]
		public MapSchema<CharacterState> characters = new MapSchema<CharacterState>();

		[Type(1, "map", typeof(MapSchema<string>), "string")]
		public MapSchema<string> playerCharacters = new MapSchema<string>();

		[Type(2, "ref", typeof(MapState))]
		public MapState map = new MapState();

		[Type(3, "number")]
		public float turn = default(float);

		[Type(4, "array", typeof(ArraySchema<string>), "string")]
		public ArraySchema<string> turnOrder = new ArraySchema<string>();

		[Type(5, "string")]
		public string currentCharacterId = default(string);

		/*
		 * Support for individual property change callbacks below...
		 */

		protected event PropertyChangeHandler<MapSchema<CharacterState>> __charactersChange;
		public Action OnCharactersChange(PropertyChangeHandler<MapSchema<CharacterState>> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.characters));
			__charactersChange += __handler;
			if (__immediate && this.characters != null) { __handler(this.characters, null); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(characters));
				__charactersChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<MapSchema<string>> __playerCharactersChange;
		public Action OnPlayerCharactersChange(PropertyChangeHandler<MapSchema<string>> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.playerCharacters));
			__playerCharactersChange += __handler;
			if (__immediate && this.playerCharacters != null) { __handler(this.playerCharacters, null); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(playerCharacters));
				__playerCharactersChange -= __handler;
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

		protected event PropertyChangeHandler<string> __currentCharacterIdChange;
		public Action OnCurrentCharacterIdChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.currentCharacterId));
			__currentCharacterIdChange += __handler;
			if (__immediate && this.currentCharacterId != default(string)) { __handler(this.currentCharacterId, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(currentCharacterId));
				__currentCharacterIdChange -= __handler;
			};
		}

		protected override void TriggerFieldChange(DataChange change) {
			switch (change.Field) {
				case nameof(characters): __charactersChange?.Invoke((MapSchema<CharacterState>) change.Value, (MapSchema<CharacterState>) change.PreviousValue); break;
				case nameof(playerCharacters): __playerCharactersChange?.Invoke((MapSchema<string>) change.Value, (MapSchema<string>) change.PreviousValue); break;
				case nameof(map): __mapChange?.Invoke((MapState) change.Value, (MapState) change.PreviousValue); break;
				case nameof(turn): __turnChange?.Invoke((float) change.Value, (float) change.PreviousValue); break;
				case nameof(turnOrder): __turnOrderChange?.Invoke((ArraySchema<string>) change.Value, (ArraySchema<string>) change.PreviousValue); break;
				case nameof(currentCharacterId): __currentCharacterIdChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				default: break;
			}
		}
	}
}
