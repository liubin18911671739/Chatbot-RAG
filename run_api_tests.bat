@echo off
echo ===== 聊天API压力测试自动化脚本 =====
echo.

echo 步骤1: 转换Excel数据到测试用例...
python excel-to-csv.py
if %ERRORLEVEL% NEQ 0 (
    echo Excel数据转换失败！
    goto :end
)
echo 数据转换完成！

echo.
echo 步骤2: 是否要运行JMeter压力测试?(y/n)
set /p run_jmeter=

if /i "%run_jmeter%"=="y" (
    echo.
    echo 请选择测试场景:
    echo 1 - 轻量测试 (10线程，持续2分钟)
    echo 2 - 中等负载 (30线程，持续5分钟)
    echo 3 - 高峰负载 (50线程，持续10分钟)
    echo 4 - 持续负载 (20线程，持续30分钟)
    echo.
    
    set /p test_scenario=请选择测试场景(1-4): 
    
    if "%test_scenario%"=="1" (
        echo 启动轻量测试...
        echo 请确保JMeter已安装并配置在PATH中
        echo 如果JMeter未安装，请按Ctrl+C退出，然后按照chat_api_stress_test.md中的指南安装JMeter
        jmeter -n -t chat_api_test_plan.jmx -Jthreads=10 -Jrampup=10 -Jduration=120 -l results_light.jtl
    ) else if "%test_scenario%"=="2" (
        echo 启动中等负载测试...
        jmeter -n -t chat_api_test_plan.jmx -Jthreads=30 -Jrampup=20 -Jduration=300 -l results_medium.jtl
    ) else if "%test_scenario%"=="3" (
        echo 启动高峰负载测试...
        jmeter -n -t chat_api_test_plan.jmx -Jthreads=50 -Jrampup=30 -Jduration=600 -l results_high.jtl
    ) else if "%test_scenario%"=="4" (
        echo 启动持续负载测试...
        jmeter -n -t chat_api_test_plan.jmx -Jthreads=20 -Jrampup=5 -Jduration=1800 -l results_sustained.jtl
    ) else (
        echo 无效的选择，跳过JMeter测试
    )
)

echo.
echo 步骤3: 运行API响应质量验证测试?(y/n)
set /p run_verify=

if /i "%run_verify%"=="y" (
    echo.
    echo 运行API响应质量验证...
    python verify_api_responses.py
    if %ERRORLEVEL% NEQ 0 (
        echo API响应验证测试失败！
    ) else (
        echo API响应验证测试完成！
    )
)

echo.
echo ===== 测试流程结束 =====
echo 请查看生成的测试报告和结果文件

:end
pause
