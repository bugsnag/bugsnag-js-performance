/**
 * MIT License
 *
 * Copyright (c) 2020 alpha0010
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * https://github.com/alpha0010/react-native-file-access/blob/7179426e701fa6e54bda6c2a753cfe31a4a08293/LICENSE
 */

// Copied from v3.0.4:
// https://github.com/alpha0010/react-native-file-access/blob/7179426e701fa6e54bda6c2a753cfe31a4a08293/jest/react-native-file-access.ts

/* eslint-disable */
/* global jest */

import { Platform } from 'react-native';
import type {
  ExternalDir,
  FetchResult,
  FileStat,
  FsStat,
  HashAlgorithm,
} from 'react-native-file-access';

export const Dirs = {
  CacheDir: '/mock/CacheDir',
  DatabaseDir: '/mock/DatabaseDir',
  DocumentDir: '/mock/DocumentDir',
  LibraryDir: '/mock/LibraryDir',
  MainBundleDir: '/mock/MainBundleDir',
};

class FileSystemMock {
  /**
   * Data store for mock filesystem.
   */
  public filesystem = new Map<string, string>();

  /**
   * Append content to a file.
   */
  public appendFile = jest.fn(async (path: string, data: string) => {
    this.filesystem.set(path, (this.filesystem.get(path) ?? '') + data);
  });

  /**
   * Append a file to another file.
   *
   * Returns number of bytes written.
   */
  public concatFiles = jest.fn(async (source: string, target: string) => {
    const data = this.getFileOrThrow(source);
    this.filesystem.set(target, (this.filesystem.get(target) ?? '') + data);
    return data.length;
  });

  /**
   * Copy a file.
   */
  public cp = jest.fn(async (source: string, target: string) => {
    this.filesystem.set(target, this.getFileOrThrow(source));
  });

  /**
   * Copy a file to external storage
   */
  public cpExternal = jest.fn(
    async (source: string, targetName: string, dir: ExternalDir) => {
      this.filesystem.set(`/${dir}/${targetName}`, this.getFileOrThrow(source));
    }
  );

  /**
   * Copy a bundled asset file.
   */
  public cpAsset = jest.fn(async (asset: string, target: string) => {
    this.filesystem.set(target, `[Mock asset data for '${asset}']`);
  });

  /**
   * Check device available space.
   */
  public df = jest.fn<Promise<FsStat>, []>(async () => ({
    internal_free: 100,
    internal_total: 200,
  }));

  /**
   * Check if a path exists.
   */
  public exists = jest.fn(async (path: string) => this.filesystem.has(path));

  /**
   * Save a network request to a file.
   */
  public fetch = jest.fn(
    async (
      resource: string,
      init: {
        body?: string;
        headers?: { [key: string]: string };
        method?: string;
        path?: string;
      }
    ): Promise<FetchResult> => {
      if (init.path != null) {
        this.filesystem.set(init.path, `[Mock fetch data for '${resource}']`);
      }
      return {
        headers: {},
        ok: true,
        redirected: false,
        status: 200,
        statusText: 'OK',
        url: resource,
      };
    }
  );

  /**
   * Return the local storage directory for app groups.
   *
   * This is an Apple only feature.
   */
  public getAppGroupDir = jest.fn((groupName: string) => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'macos') {
      throw new Error('AppGroups are available on Apple devices only');
    }
    return `${Dirs.DocumentDir}/shared/AppGroup/${groupName}`;
  });

  /**
   * Hash the file content.
   */
  public hash = jest.fn(async (path: string, algorithm: HashAlgorithm) => {
    if (!this.filesystem.has(path)) {
      throw new Error(`File ${path} not found`);
    }
    return `[${algorithm} hash of '${path}']`;
  });

  /**
   * Check if a path is a directory.
   */
  public isDir = jest.fn(async (path: string) => !this.filesystem.has(path));

  /**
   * List files in a directory.
   */
  public ls = jest.fn(async (_path: string) => ['file1', 'file2']);

  /**
   * Make a directory.
   *
   * This is a noop as the mock file system does not differentiate between files
   * and directories
   *
   * NOTE: this method was added by bugsnag
   */
  public mkdir = jest.fn(async () => {})

  /**
   * Move a file.
   */
  public mv = jest.fn(async (source: string, target: string) => {
    this.filesystem.set(target, this.getFileOrThrow(source));
    this.filesystem.delete(source);
  });

  /**
   * Read the content of a file.
   */
  public readFile = jest.fn(async (path: string) => this.getFileOrThrow(path));

  /**
   * Read file metadata.
   */
  public stat = jest.fn(
    async (path: string): Promise<FileStat> => ({
      filename: path.substring(path.lastIndexOf('/')),
      lastModified: 1,
      path: path,
      size: this.getFileOrThrow(path).length,
      type: 'file',
    })
  );

  /**
   * Delete a file.
   */
  public unlink = jest.fn(async (path: string) => {
    this.filesystem.delete(path);
  });

  /**
   * Write content to a file.
   */
  public writeFile = jest.fn(async (path: string, data: string) => {
    this.filesystem.set(path, data);
  });

  private getFileOrThrow(path: string): string {
    const data = this.filesystem.get(path);
    if (data == null) {
      throw new Error(`File ${path} not found`);
    }
    return data;
  }
}

export const FileSystem = new FileSystemMock();
