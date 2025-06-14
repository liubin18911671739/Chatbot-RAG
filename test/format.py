def process_file(input_file, output_file):
    """
    处理输入文件中的每一行，添加前缀和后缀，并写入输出文件
    
    参数:
        input_file: 输入文件路径
        output_file: 输出文件路径
    """
    with open(input_file, 'r', encoding='utf-8') as f_in:
        lines = f_in.readlines()
    
    formatted_lines = format_lines(lines)
    
    with open(output_file, 'w', encoding='utf-8') as f_out:
        for line in formatted_lines:
            f_out.write(line + '\n')

# 使用示例
# process_file('input.txt', 'output.txt')

def format_lines(lines):
    """
    为每一行内容添加指定的前缀和后缀
    
    参数:
        lines: 包含多行内容的列表
    
    返回:
        格式化后的行列表
    """
    formatted_lines = []
    for line in lines:
        # 去除可能存在的换行符，确保格式一致
        line = line.strip()
        # 添加前缀和后缀
        formatted_line = "    { text: '" + line + "', type: 'local' },"
        formatted_lines.append(formatted_line)
    
    return formatted_lines

# 示例使用
if __name__ == "__main__":
    # 示例数据，可以从文件中读取或其他来源获取
    # sample_lines = [
    #     "密集书库的图书可以外借吗",
    #     "期刊能外借吗",
    #     "我校图书馆有馆际互借服务吗"
    # ]
    
    # # 处理数据
    # result = format_lines(sample_lines)
    
    # # 打印结果
    # for formatted_line in result:
    #     print(formatted_line)
    process_file('input.txt', 'output.txt')