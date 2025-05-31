def process_file(input_file, output_file):
    """
    处理输入文件中的每一行，将其格式化为prompts数组元素，并·写入输出文件
    
    参数:
        input_file: 输入文件路径
        output_file: 输出文件路径
    """
    with open(input_file, 'r', encoding='utf-8') as f_in:
        lines = f_in.readlines()
    
    formatted_lines = format_lines(lines)
    
    with open(output_file, 'w', encoding='utf-8') as f_out:
        # 写入prompts数组的开头
        f_out.write("prompts: [\n")
        # 写入格式化后的行
        for line in formatted_lines:
            f_out.write("    " + line + "\n")
        # 写入prompts数组的结尾
        f_out.write("]\n")

# 使用示例
# process_file('input.txt', 'output.txt')

def format_lines(lines):
    """
    为每一行内容添加指定的前缀和后缀，格式化为prompts数组中的元素
    
    参数:
        lines: 包含多行内容的列表
    
    返回:
        格式化后的行列表
    """
    formatted_lines = []
    for line in lines:
        # 去除可能存在的换行符，确保格式一致
        line = line.strip()
        # 添加前缀和后缀，格式化为prompts数组中的元素
        formatted_line = "'" + line + "',"
        formatted_lines.append(formatted_line)
    
    return formatted_lines

# 示例使用
if __name__ == "__main__":
    process_file('input.txt', 'output1.txt')