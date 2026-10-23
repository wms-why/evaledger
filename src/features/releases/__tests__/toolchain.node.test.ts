import { describe, expect, it } from 'vitest'
import { isToolchainVersion } from '../toolchain'

/**
 * The release guard reads every bare decimal in an article as a score claim.
 * A deployment walkthrough names toolchain versions instead, and those must
 * not be read as measurements.
 */
describe('isToolchainVersion', () => {
  it('recognises a version that belongs to a toolchain name', () => {
    for (const before of [
      'Linux, GCC >= 13.0, Python ',
      'on the NVIDIA path and CANN ',
      'and CUDA ',
      'using Node.js ',
      'with CMake ',
      'and G++ ',
    ]) {
      expect(isToolchainVersion(before), before).toBe(true)
    }
  })

  it('does not excuse a score just because a tool is mentioned earlier', () => {
    // The check is anchored to the end of the text, so a tool name earlier in
    // the paragraph must not let a real score through.
    expect(isToolchainVersion('Built with CUDA, it scores ')).toBe(false)
    expect(isToolchainVersion('it scores ')).toBe(false)
    expect(isToolchainVersion('')).toBe(false)
  })
})
