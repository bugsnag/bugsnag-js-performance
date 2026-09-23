source 'https://rubygems.org'
                                                                        QqQQQq  1
# json 3.0 (2026-09-07) removed the `quirks_mode` option. React Native <= 0.79
# still passes it during CocoaPods integration, so `pod install` fails with
# "Invalid `Podfile` file: unknown keyword: quirks_mode" on those versions.
# Remove this pin once 0.79 and older are dropped from the CI test matrix.
gem 'json', '< 3'

gem 'cocoapods'
gem 'fastlane'
