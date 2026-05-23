import com.android.build.gradle.LibraryExtension

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

// flutter_inappwebview_android enables library minifyRelease; R8 then fails on optional Chrome Custom Tabs stubs.
// App release already shrinks merged code; turning off library minify is the usual Flutter fix.
subprojects {
    plugins.withId("com.android.library") {
        if (name == "flutter_inappwebview_android") {
            extensions.configure<LibraryExtension>("android") {
                buildTypes.getByName("release") { isMinifyEnabled = false }
            }
        }
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
