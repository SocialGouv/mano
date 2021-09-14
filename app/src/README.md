# Installation

- run `yarn` - it will install the dependencies and run the `postinstall` script
- until [this PR in react-native-sodium](https://github.com/lyubo/react-native-sodium/pull/43) is merged, we need to patch the file `/node_modules/react-native-sodium/android/build.gradle` and [remove the following lines](https://github.com/lyubo/react-native-sodium/pull/43/files):

```
    sourceSets {
         main {
             jniLibs.srcDirs = ['./lib']
         }
     }
```
