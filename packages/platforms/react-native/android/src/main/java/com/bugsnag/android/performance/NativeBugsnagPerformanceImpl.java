package com.bugsnag.reactnative.performance;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import java.security.SecureRandom;
import java.io.File;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.io.FileInputStream;
import java.io.FileOutputStream;

class NativeBugsnagPerformanceImpl {
  
  static final String MODULE_NAME = "BugsnagReactNativePerformance";
  
  private final ReactApplicationContext reactContext;

  private final SecureRandom random = new SecureRandom();

  public NativeBugsnagPerformanceImpl(ReactApplicationContext reactContext) {
    this.reactContext = reactContext;
  }

  WritableMap getDeviceInfo() {
    WritableMap map = Arguments.createMap();
    try {
      String bundleIdentifier = this.reactContext.getPackageName();
      map.putString("bundleIdentifier", bundleIdentifier);
      PackageInfo packageInfo = this.reactContext.getPackageManager().getPackageInfo(bundleIdentifier, 0);
      map.putString("versionCode", Integer.toString(packageInfo.versionCode));
    } catch (Exception e) {
      // ignore
    }

    String arch = null;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      String[] supportedAbis = Build.SUPPORTED_ABIS;
      if (supportedAbis != null && supportedAbis.length > 0) {
        arch = abiToArchitecture(supportedAbis[0]);
      }
    } else {
      arch = abiToArchitecture(Build.CPU_ABI);
    }

    if (arch != null) {
      map.putString("arch", arch);
    }

    map.putString("model", Build.MODEL);

    return map;
  }

  String requestEntropy() {
    byte[] bytes = new byte[1024];
    random.nextBytes(bytes);

    StringBuilder hex = new StringBuilder(bytes.length * 2);
    for(byte b : bytes) {
        int byteValue = ((int)b & 0xff);
        if(byteValue < 16) {
            hex.append('0');
        }
        hex.append(Integer.toHexString(byteValue));
    }
    return hex.toString();
  }

  void requestEntropyAsync(Promise promise) {
    promise.resolve(requestEntropy());
  }

  WritableMap getNativeConstants() {
    WritableMap map = Arguments.createMap();
    map.putString("CacheDir", this.reactContext.getCacheDir().getAbsolutePath());
    map.putString("DocumentDir", this.reactContext.getFilesDir().getAbsolutePath());

    return map;
  }

  void exists(String path, Promise promise) {
    try {
      boolean result = new File(path).exists();
      if (result) {
        promise.resolve(result);
      } else {
        promise.reject(new Exception("File does not exist"));
      }
    } catch(Exception e) {
      promise.reject(e);
    }
  }

  void isDir(String path, Promise promise) {
    try {
      boolean result = new File(path).isDirectory();
      if (result) {
        promise.resolve(result);
      } else {
        promise.reject(new Exception("Path is not a directory"));
      }
    } catch(Exception e) {
      promise.reject(e);
    }
  }

  void ls(String path, Promise promise) {
    try {
      promise.resolve(new File(path).list());
    } catch(Exception e) {
      promise.reject(e);
    }
  }

  void mkdir(String path, Promise promise) {
    try {
      boolean result = new File(path).mkdir();
      if (result) {
        promise.resolve(path);
      } else {
        promise.reject(new Exception("Failed to create directory"));
      }
    } catch(Exception e) {
      promise.reject(e);
    }
  }

  void readFile(String path, String encoding, Promise promise) {
    File file = new File(path);
    StringBuilder fileContent = new StringBuilder((int) file.length());
    try(
      FileInputStream fin = new FileInputStream(file);
      InputStreamReader isr = new InputStreamReader(fin, encoding);
    ) {
      char[] buffer = new char[4096];
      int charsRead = 0;
      while ((charsRead = isr.read(buffer)) != -1) {
        fileContent.append(buffer, 0, charsRead);
      }
      promise.resolve(fileContent.toString());
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  void unlink(String path, Promise promise) {
    try {
      boolean result = new File(path).delete();
      if (result) {
        promise.resolve(null);
      } else {
        promise.reject(new Exception("Failed to delete file/directory"));
      }
    } catch(Exception e) {
      promise.reject(e);
    }
  }

  void writeFile(String path, String data, String encoding, Promise promise){
    try(
      FileOutputStream fout = new FileOutputStream(path);
      Writer w = new OutputStreamWriter(fout, encoding);
    ) {
      w.write(data);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @Nullable
  private String abiToArchitecture(@Nullable String abi) {
    if (abi == null) {
      return null;
    }

    switch (abi) {
      case "armeabi-v7a":
        return "arm32";
      case "arm64-v8a":
        return "arm64";
      case "x86":
        return "x86";
      case "x86_64":
        return "amd64";
      default:
        return null;
    }
  }
}
