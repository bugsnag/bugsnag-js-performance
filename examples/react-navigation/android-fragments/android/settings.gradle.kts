import groovy.lang.Closure

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
//    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "React Navigation Android Fragment"

include(":app")
includeBuild("../node_modules/@react-native/gradle-plugin")

apply(from = "../node_modules/@react-native-community/cli-platform-android/native_modules.gradle")
val applyNativeModules: Closure<*> = extra.get("applyNativeModulesSettingsGradle") as Closure<*>
applyNativeModules(settings)
