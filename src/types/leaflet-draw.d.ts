// ============================================================
// Types personnalisés pour leaflet-draw
// ============================================================

declare module 'leaflet-draw' {
  import * as L from 'leaflet';

  namespace Control {
    class Draw extends L.Control {
      constructor(options?: L.Control.DrawConstructorOptions);
    }
  }

  namespace Control {
    interface DrawConstructorOptions {
      draw?: DrawOptions;
      edit?: EditOptions;
      position?: L.ControlPosition;
    }
  }

  interface DrawOptions {
    polyline?: L.PolylineOptions | boolean;
    polygon?: L.PolygonOptions | boolean;
    rectangle?: L.RectangleOptions | boolean;
    circle?: L.CircleOptions | boolean;
    marker?: L.MarkerOptions | boolean;
    circlemarker?: L.CircleMarkerOptions | boolean;
  }

  interface EditOptions {
    featureGroup: L.FeatureGroup;
    edit?: boolean | { selectedPathOptions?: L.PathOptions };
    remove?: boolean;
    poly?: L.PolylineOptions;
  }

  namespace DrawEvents {
    interface Created extends L.LeafletEvent {
      layerType: string;
      layer: L.Layer;
    }

    interface Edited extends L.LeafletEvent {
      layers: L.LayerGroup;
    }

    interface Deleted extends L.LeafletEvent {
      layers: L.LayerGroup;
    }
  }
}
