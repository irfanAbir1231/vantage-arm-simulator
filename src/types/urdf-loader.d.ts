// OWNER: Team Lead
// Do not edit without coordinating with the owner.

declare module "urdf-loader" {
  import type { LoadingManager, Object3D } from "three";

  export default class URDFLoader {
    constructor(manager?: LoadingManager);
    load(url: string, onLoad: (robot: Object3D) => void): void;
  }
}
