import uuid
import time
import threading
import logging
from typing import Dict, Any, Optional, List

class Task:
    """表示单个任务的类"""
    def __init__(self, task_id: str, task_type: str, params: Dict[str, Any]):
        self.id = task_id
        self.type = task_type
        self.params = params
        self.status = "pending"  # pending, running, completed, failed
        self.progress = 0
        self.result = None
        self.error = None
        self.start_time = None
        self.end_time = None
        self.processed_items = 0
        # 用于停止任务的标志
        self.stop_requested = False

class TaskManager:
    """管理系统中所有任务的服务"""
    _instance = None
    
    @classmethod
    def get_instance(cls):
        """单例模式获取实例"""
        if cls._instance is None:
            cls._instance = TaskManager()
        return cls._instance
    
    def __init__(self):
        self.tasks: Dict[str, Task] = {}
        self.logger = logging.getLogger(__name__)
        self.lock = threading.RLock()  # 使用可重入锁保护任务字典
    
    def create_task(self, task_type: str, params: Dict[str, Any]) -> str:
        """
        创建新任务
        
        Args:
            task_type: 任务类型
            params: 任务参数
            
        Returns:
            str: 任务ID
        """
        with self.lock:
            task_id = str(uuid.uuid4())
            task = Task(task_id, task_type, params)
            self.tasks[task_id] = task
            self.logger.info(f"创建任务 {task_id} 类型 {task_type}")
            return task_id
    
    def start_task(self, task_id: str) -> bool:
        """
        标记任务为运行状态
        
        Args:
            task_id: 任务ID
            
        Returns:
            bool: 是否成功启动
        """
        with self.lock:
            if task_id not in self.tasks:
                self.logger.error(f"任务 {task_id} 不存在")
                return False
                
            task = self.tasks[task_id]
            task.status = "running"
            task.start_time = time.time()
            self.logger.info(f"开始运行任务 {task_id}")
            return True
    
    def complete_task(self, task_id: str, result: Any = None) -> bool:
        """
        标记任务为完成状态
        
        Args:
            task_id: 任务ID
            result: 任务结果
            
        Returns:
            bool: 是否成功完成
        """
        with self.lock:
            if task_id not in self.tasks:
                self.logger.error(f"任务 {task_id} 不存在")
                return False
                
            task = self.tasks[task_id]
            task.status = "completed"
            task.end_time = time.time()
            task.result = result
            task.progress = 100
            self.logger.info(f"完成任务 {task_id}")
            return True
    
    def fail_task(self, task_id: str, error: str) -> bool:
        """
        标记任务为失败状态
        
        Args:
            task_id: 任务ID
            error: 错误信息
            
        Returns:
            bool: 是否成功标记
        """
        with self.lock:
            if task_id not in self.tasks:
                self.logger.error(f"任务 {task_id} 不存在")
                return False
                
            task = self.tasks[task_id]
            task.status = "failed"
            task.end_time = time.time()
            task.error = error
            self.logger.error(f"任务 {task_id} 失败: {error}")
            return True
    
    def update_progress(self, task_id: str, progress: int, processed_items: int = None) -> bool:
        """
        更新任务进度
        
        Args:
            task_id: 任务ID
            progress: 进度百分比(0-100)
            processed_items: 已处理的数据项数量
            
        Returns:
            bool: 是否成功更新
        """
        with self.lock:
            if task_id not in self.tasks:
                self.logger.error(f"任务 {task_id} 不存在")
                return False
                
            task = self.tasks[task_id]
            task.progress = min(max(0, progress), 100)  # 限制在0-100范围内
            
            if processed_items is not None:
                task.processed_items = processed_items
                
            self.logger.debug(f"更新任务 {task_id} 进度: {progress}%")
            return True
    
    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        获取任务状态
        
        Args:
            task_id: 任务ID
            
        Returns:
            Optional[Dict[str, Any]]: 任务状态信息
        """
        with self.lock:
            if task_id not in self.tasks:
                self.logger.error(f"任务 {task_id} 不存在")
                return None
                
            task = self.tasks[task_id]
            return {
                "id": task.id,
                "type": task.type,
                "status": task.status,
                "progress": task.progress,
                "result": task.result,
                "error": task.error,
                "start_time": task.start_time,
                "end_time": task.end_time,
                "processed_items": task.processed_items,
                "duration": task.end_time - task.start_time if task.end_time and task.start_time else None
            }
    
    def request_stop_task(self, task_id: str) -> bool:
        """
        请求停止任务
        
        Args:
            task_id: 任务ID
            
        Returns:
            bool: 是否成功请求
        """
        with self.lock:
            if task_id not in self.tasks:
                self.logger.error(f"任务 {task_id} 不存在")
                return False
                
            task = self.tasks[task_id]
            task.stop_requested = True
            self.logger.info(f"请求停止任务 {task_id}")
            return True
    
    def should_stop_task(self, task_id: str) -> bool:
        """
        检查任务是否应该停止
        
        Args:
            task_id: 任务ID
            
        Returns:
            bool: 是否应该停止
        """
        with self.lock:
            if task_id not in self.tasks:
                return True  # 如果任务不存在，应该停止
            return self.tasks[task_id].stop_requested
    
    def list_tasks(self, status: str = None) -> List[Dict[str, Any]]:
        """
        列出所有任务或按状态筛选
        
        Args:
            status: 可选状态筛选
            
        Returns:
            List[Dict[str, Any]]: 任务列表
        """
        with self.lock:
            result = []
            for task_id, task in self.tasks.items():
                if status is None or task.status == status:
                    result.append({
                        "id": task.id,
                        "type": task.type,
                        "status": task.status,
                        "progress": task.progress
                    })
            return result
    
    def clean_completed_tasks(self, max_age_hours: float = 24.0) -> int:
        """
        清理已完成或失败的、超过最大保留时间的任务
        
        Args:
            max_age_hours: 最大保留时间（小时）
            
        Returns:
            int: 被删除的任务数量
        """
        with self.lock:
            current_time = time.time()
            max_age_seconds = max_age_hours * 3600
            tasks_to_remove = []
            
            # 首先创建所有任务的副本避免循环中修改字典
            task_items = list(self.tasks.items())
            
            for task_id, task in task_items:
                # 调试信息
                print(f"任务 {task_id}: 状态={task.status}, 结束时间={task.end_time}")
                
                # 明确使用 or 连接两个条件
                if (task.status == "completed" or task.status == "failed") and task.end_time is not None:
                    age = current_time - task.end_time
                    print(f"  计算年龄: {age/3600:.2f}小时 > {max_age_hours}小时? {age > max_age_seconds}")
                    
                    if age > max_age_seconds:
                        print(f"  将删除任务 {task_id}")
                        tasks_to_remove.append(task_id)
            
            # 单独循环删除任务
            for task_id in tasks_to_remove:
                del self.tasks[task_id]
            
            return len(tasks_to_remove)
