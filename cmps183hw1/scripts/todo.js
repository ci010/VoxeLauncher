function displayFunc(option){
  if(option == 1){
    document.getElementById("task1").style.display="block";
    document.getElementById("task2").style.display="block";
    document.getElementById("task3").style.display="block";
    document.getElementById("task4").style.display="block";
  }else if(option == 2){
    document.getElementById("task1").style.display="block";
    document.getElementById("task2").style.display="block";
    document.getElementById("task3").style.display="none";
    document.getElementById("task4").style.display="none";
  }else if(option == 3){
    document.getElementById("task1").style.display="none";
    document.getElementById("task2").style.display="none";
    document.getElementById("task3").style.display="block";
    document.getElementById("task4").style.display="block";
  }
}