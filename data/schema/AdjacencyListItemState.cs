// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 2.0.15
// 

using Colyseus.Schema;
using Action = System.Action;

namespace UFB.StateSchema {
	public partial class AdjacencyListItemState : Schema {
		[Type(0, "array", typeof(ArraySchema<TileEdgeState>))]
		public ArraySchema<TileEdgeState> edges = new ArraySchema<TileEdgeState>();

		/*
		 * Support for individual property change callbacks below...
		 */

		protected event PropertyChangeHandler<ArraySchema<TileEdgeState>> __edgesChange;
		public Action OnEdgesChange(PropertyChangeHandler<ArraySchema<TileEdgeState>> __handler, bool __immediate = true) {
			if (__callbacks == null) { __callbacks = new SchemaCallbacks(); }
			__callbacks.AddPropertyCallback(nameof(this.edges));
			__edgesChange += __handler;
			if (__immediate && this.edges != null) { __handler(this.edges, null); }
			return () => {
				__callbacks.RemovePropertyCallback(nameof(edges));
				__edgesChange -= __handler;
			};
		}

		protected override void TriggerFieldChange(DataChange change) {
			switch (change.Field) {
				case nameof(edges): __edgesChange?.Invoke((ArraySchema<TileEdgeState>) change.Value, (ArraySchema<TileEdgeState>) change.PreviousValue); break;
				default: break;
			}
		}
	}
}
