import { TurboModule, TurboModuleRegistry } from "react-native";

export type BugsnagConfiguration = {
    apiKey: string;
    notifyEndpoint: string;
    sessionsEndpoint: string;
}

export interface Spec extends TurboModule {
  startBugsnag(configuration: BugsnagConfiguration): Promise<void>;
  clearPersistentData(): Promise<void>;
}

export default TurboModuleRegistry.get<Spec>("ScenarioLauncher") as Spec | null;
