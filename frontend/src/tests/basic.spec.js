/**
 * 基础测试 - 验证 Jest 配置正常工作
 */

describe('基础测试', () => {
  test('Jest 配置正常', () => {
    expect(true).toBe(true)
  })

  test('数学运算正常', () => {
    expect(1 + 1).toBe(2)
  })

  test('字符串操作正常', () => {
    const str = 'Hello World'
    expect(str).toContain('World')
  })

  test('数组操作正常', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr).toContain(2)
  })

  test('对象操作正常', () => {
    const obj = { name: 'Test', value: 123 }
    expect(obj).toHaveProperty('name')
    expect(obj.value).toBe(123)
  })
})
