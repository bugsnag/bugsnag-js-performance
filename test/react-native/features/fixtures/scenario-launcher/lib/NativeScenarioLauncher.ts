import { TurboModule, TurboModuleRegistry } from "react-native";
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes'

export interface Spec extends TurboModule {
  startBugsnag(configuration: UnsafeObject): Promise<void>;
  clearPersistentData(): void;
  saveStartupConfig(config: UnsafeObject): void;
  readStartupConfig(): UnsafeObject | null | undefined;
  exitApp(): void;
}

export default TurboModuleRegistry.get<Spec>("ScenarioLauncher") as Spec | null;
