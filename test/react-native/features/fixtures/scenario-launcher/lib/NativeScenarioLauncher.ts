import { TurboModule, TurboModuleRegistry } from "react-native";
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes'

export interface Spec extends TurboModule {
  startBugsnag(configuration: UnsafeObject): Promise<void>;
  clearPersistentData(): void;
  saveStartupConfig(config: UnsafeObject): void;
  readStartupConfig(): UnsafeObject | null | undefined;
  exitApp(): void;
  startNativePerformance(configuration: UnsafeObject): Promise<void>;
  sendNativeChildSpan(traceParent: string): Promise<void>;
  getNativeTraceParent(): Promise<string>;
}

export default TurboModuleRegistry.get<Spec>("ScenarioLauncher") as Spec | null;
