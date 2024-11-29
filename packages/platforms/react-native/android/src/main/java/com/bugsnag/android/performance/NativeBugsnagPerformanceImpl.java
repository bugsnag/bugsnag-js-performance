package com.bugsnag.reactnative.performance;

import android.content.pm.PackageInfo;
import android.os.Build;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import java.security.SecureRandom;

import com.bugsnag.android.performance.BugsnagPerformance;
import com.bugsnag.android.performance.SpanOptions;

import com.bugsnag.android.performance.internal.BugsnagClock;
import com.bugsnag.android.performance.internal.EncodingUtils;
import com.bugsnag.android.performance.internal.SpanFactory;
import com.bugsnag.android.performance.internal.SpanImpl;
import com.bugsnag.android.performance.internal.processing.ImmutableConfig;

class NativeBugsnagPerformanceImpl {

  static final String MODULE_NAME = "BugsnagReactNativePerformance";

  private final ReactApplicationContext reactContext;

  private final SecureRandom random = new SecureRandom();

  private boolean isNativePerformanceAvailable = false;

  public NativeBugsnagPerformanceImpl(ReactApplicationContext reactContext) {
    this.reactContext = reactContext;

    try {
      Class.forName("com.bugsnag.android.performance.BugsnagPerformance");
      Class.forName("com.bugsnag.android.performance.internal.InstrumentedAppState");
      isNativePerformanceAvailable = true;
    }
    catch (LinkageError e) {
      // do nothing, class found but is incompatible
    }
    catch (ClassNotFoundException e) {
      // do nothing, Android Performance SDK is not installed
    }
  }

  public WritableMap getDeviceInfo() {
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

  public String requestEntropy() {
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

  public void requestEntropyAsync(Promise promise) {
    promise.resolve(requestEntropy());
  }

  public boolean isNativePerformanceAvailable() {
    return isNativePerformanceAvailable;
  }

  @Nullable
  public WritableMap getNativeConfiguration() {
    if (!isNativePerformanceAvailable) {
      return null;
    }

    ImmutableConfig nativeConfig = BugsnagPerformance.INSTANCE.getInstrumentedAppState$internal().getConfig$internal();
    if (nativeConfig == null) {
      return null;
    }

    WritableMap result = Arguments.createMap();
    result.putString("apiKey", nativeConfig.getApiKey());
    result.putString("endpoint", nativeConfig.getEndpoint());
    result.putString("releaseStage", nativeConfig.getReleaseStage());
    result.putString("serviceName", nativeConfig.getServiceName());
    result.putInt("attributeCountLimit", nativeConfig.getAttributeCountLimit());
    result.putInt("attributeStringValueLimit", nativeConfig.getAttributeStringValueLimit());
    result.putInt("attributeArrayLengthLimit", nativeConfig.getAttributeArrayLengthLimit());

    var appVersion = nativeConfig.getAppVersion();
    if (appVersion != null) {
      result.putString("appVersion", nativeConfig.getAppVersion());
    }

    var samplingProbability = nativeConfig.getSamplingProbability();
    if (samplingProbability != null) {
      result.putDouble("samplingProbability", samplingProbability);
    }

    var enabledReleaseStages = nativeConfig.getEnabledReleaseStages();
    if (enabledReleaseStages != null) {
      result.putArray("enabledReleaseStages", Arguments.fromArray(enabledReleaseStages.toArray(new String[0])));
    }

    return result;
  }

  @Nullable
  public WritableMap startNativeSpan(String name, ReadableMap options) {
    if (!isNativePerformanceAvailable) {
      return null;
    }

    SpanOptions spanOptions = readableMapToSpanOptions(options);
    SpanFactory spanFactory = BugsnagPerformance.INSTANCE.getInstrumentedAppState$internal().getSpanFactory();
    SpanImpl nativeSpan = spanFactory.createCustomSpan(name, spanOptions);

    nativeSpan.getAttributes().getEntries$internal().clear();

    WritableMap span = nativeSpanToJsSpan(nativeSpan);
    return span;
  }

  private WritableMap nativeSpanToJsSpan(SpanImpl nativeSpan) {
    WritableMap span = Arguments.createMap();
    span.putString("name", nativeSpan.getName());
    span.putString("id", EncodingUtils.toHexString(nativeSpan.getSpanId()));
    span.putString("traceId", EncodingUtils.toHexString(nativeSpan.getTraceId()));

    long unixNanoStartTime = BugsnagClock.INSTANCE.elapsedNanosToUnixTime(nativeSpan.getStartTime$internal());
    span.putDouble("startTime", (double)unixNanoStartTime);

    long parentSpanId = nativeSpan.getParentSpanId();
    if (parentSpanId != 0L) {
      span.putString("parentSpanId", EncodingUtils.toHexString(parentSpanId));
    }

    return span;
  }

  private SpanOptions readableMapToSpanOptions(ReadableMap jsOptions) {
    SpanOptions spanOptions = SpanOptions.DEFAULTS
      .setFirstClass(true)
      .makeCurrentContext(false)
      .within(null);

    if (jsOptions.hasKey("startTime")) {
      double startTime = jsOptions.getDouble("startTime");
      long nativeStartTime = BugsnagClock.INSTANCE.unixNanoTimeToElapsedRealtime((long)startTime);
      spanOptions = spanOptions.startTime(nativeStartTime);
    }

    ReadableMap parentContext = null;
    if (jsOptions.hasKey("parentContext") && (parentContext = jsOptions.getMap("parentContext")) != null) {
      ReactNativeSpanContext nativeParentContext = new ReactNativeSpanContext(
        parentContext.getString("id"),
        parentContext.getString("traceId")
      );

      spanOptions = spanOptions.within(nativeParentContext);
    }

    return spanOptions;
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
