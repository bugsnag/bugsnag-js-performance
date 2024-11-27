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

export const Dirs = {
  CacheDir: '/mock/CacheDir',
  DocumentDir: '/mock/DocumentDir',
};

const DIR_MARKER = '__dir__';

class FileSystemMock {
  /**
   * Data store for mock filesystem.
   */
  public filesystem = new Map<string, string>();

  /**
   * Check if a path exists.
   */
  public exists = jest.fn(async (path: string) => this.filesystem.has(path));

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
  public mkdir = jest.fn(async (path: string) => {
    this.filesystem.set(path, DIR_MARKER)
    return path
  })

  /**
   * Read the content of a file.
   */
  public readFile = jest.fn(async (path: string) => this.getFileOrThrow(path));

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
