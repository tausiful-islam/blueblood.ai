declare module "react-simple-maps" {
  import { ComponentType, ReactNode } from "react";

  interface GeographyProps {
    key: string;
    geography: any;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: any;
      hover?: any;
      pressed?: any;
    };
    onMouseEnter?: (e: any) => void;
    onMouseLeave?: (e: any) => void;
    onMouseMove?: (e: any) => void;
    onClick?: (e: any) => void;
  }

  interface GeographiesProps {
    geography: string;
    children: (props: { geographies: any[] }) => ReactNode;
  }

  export const ComposableMap: ComponentType<any>;
  export const ZoomableGroup: ComponentType<any>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
}
