// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 2.0.15
// 

using Colyseus.Schema;
using Action = System.Action;

namespace UFB.StateSchema {
	public partial class CharacterState : Schema {
		[Type(0, "string")]
		public string id = default(string);

		[Type(1, "string")]
		public string displayName = default(string);

		[Type(2, "string")]
		public string sessionId = default(string);

		[Type(3, "string")]
		public string characterId = default(string);

		[Type(4, "string")]
		public string characterClass = default(string);

		[Type(5, "string")]
		public string mapName = default(string);

		[Type(6, "ref", typeof(CoordinatesState))]
		public CoordinatesState coordinates = new CoordinatesState();

		[Type(7, "ref", typeof(CharacterStatsState))]
		public CharacterStatsState stats = new CharacterStatsState();

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

		protected event PropertyChangeHandler<string> __displayNameChange;
		public Action OnDisplayNameChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.displayName));
			__displayNameChange += __handler;
			if (__immediate && this.displayName != default(string)) { __handler(this.displayName, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(displayName));
				__displayNameChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<string> __sessionIdChange;
		public Action OnSessionIdChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.sessionId));
			__sessionIdChange += __handler;
			if (__immediate && this.sessionId != default(string)) { __handler(this.sessionId, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(sessionId));
				__sessionIdChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<string> __characterIdChange;
		public Action OnCharacterIdChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.characterId));
			__characterIdChange += __handler;
			if (__immediate && this.characterId != default(string)) { __handler(this.characterId, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(characterId));
				__characterIdChange -= __handler;
			};
		}

		protected event PropertyChangeHandler<string> __characterClassChange;
		public Action OnCharacterClassChange(PropertyChangeHandler<string> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.characterClass));
			__characterClassChange += __handler;
			if (__immediate && this.characterClass != default(string)) { __handler(this.characterClass, default(string)); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(characterClass));
				__characterClassChange -= __handler;
			};
		}

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

		protected event PropertyChangeHandler<CharacterStatsState> __statsChange;
		public Action OnStatsChange(PropertyChangeHandler<CharacterStatsState> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.stats));
			__statsChange += __handler;
			if (__immediate && this.stats != null) { __handler(this.stats, null); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(stats));
				__statsChange -= __handler;
			};
		}

		protected override void TriggerFieldChange(DataChange change) {
			switch (change.Field) {
				case nameof(id): __idChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(displayName): __displayNameChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(sessionId): __sessionIdChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(characterId): __characterIdChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(characterClass): __characterClassChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(mapName): __mapNameChange?.Invoke((string) change.Value, (string) change.PreviousValue); break;
				case nameof(coordinates): __coordinatesChange?.Invoke((CoordinatesState) change.Value, (CoordinatesState) change.PreviousValue); break;
				case nameof(stats): __statsChange?.Invoke((CharacterStatsState) change.Value, (CharacterStatsState) change.PreviousValue); break;
				default: break;
			}
		}
	}
}
