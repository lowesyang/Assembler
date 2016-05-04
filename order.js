var orderText=document.getElementById("order");
var orderRes=document.getElementsByClassName("orderRes")[0];
var submitBtn=document.getElementById("submitBtn");
var deComTop=deCompRes.offsetTop;

submitBtn.addEventListener("click",function(e){
    e.preventDefault();
    var instr=orderText.value;
    switch(instr){
        case "D"://数据方式看内存
            order.showMemByData();
            break;
        case "U"://指令方式看内存
            order.showMemByOrder();
            break;
        case "A"://写汇编指令到内存
            compileBtn.click();
            alert("编译成功！");
            break;
        case "T"://单步执行内存中的指令
            order.singleRun();
            break;
        default:
            alert("请输入已有命令！");
            break;
    }
});

//--------输入指令类--------
var order={
    //--------数据方式看内存--------
    showMemByData:function(){
        orderRes.innerHTML="";
        for(var i=0;i<RAM.maxPC;i++){
            orderRes.innerHTML+="("+i+")  "+ASSEM.getBinary(RAM.Memory[i],8)+"<br>";
        }
    },

    //--------指令方式看内存--------
    showMemByOrder:function(){
        var pc=0;
        orderRes.innerHTML="";
        for(var i in RAM.instruct){
            orderRes.innerHTML+="PC["+pc+"]-["+(pc+4)+"]:"+RAM.instruct[i]+"<br>";
            pc+=4;
        }
    },

    //--------单步运行--------
    singleRun:function(){
        if(!RAM.state || !RAM.maxPC) {
            return alert("请先编译！");
        }
        if(!ASSEM.begin){
            pointer.style.display="block";
            pointer.style.top=deComTop+4+"px";
            return ASSEM.begin=1;
        }
        var IR,op,rs,rt,rd,fun,Iimmi,Jimmi;
        IR=(RAM.Memory[RAM.PC])|(RAM.Memory[RAM.PC+1]<<8)|(RAM.Memory[RAM.PC+2]<<16)|(RAM.Memory[RAM.PC+3]<<24);
        op=(IR>>26)&63;
        rs=(IR>>21)&31;
        rt=(IR>>16)&31;
        rd=(IR>>11)&31;
        fun=IR&63;
        Iimmi=IR&0xFFFF;
        Jimmi=(IR&0x3FFFFFF)<<2;

        switch(op){
            case 0://R-type
                switch(fun){
                    case 32://ADD
                        REGIST.value[rd]=REGIST.value[rs]+REGIST.value[rt];
                        break;
                    case 34://SUB
                        REGIST.value[rd]=REGIST.value[rs]-REGIST.value[rt];
                        break;
                }
                break;
            case 35://LW
                REGIST.value[rt]=(RAM.Memory[rs+Iimmi+0])|(RAM.Memory[rs+Iimmi+1]<<8)|
                    (RAM.Memory[rs+Iimmi+2]<<16)|(RAM.Memory[rs+Iimmi+3]<<24);
                break;
            case 43://SW
                RAM.Memory[rt+Iimmi+0]=(REGIST.value[rt])&0xFF;
                RAM.Memory[rt+Iimmi+1]=(REGIST.value[rt]>>8)&0xFF;
                RAM.Memory[rt+Iimmi+2]=(REGIST.value[rt]>>16)&0xFF;
                RAM.Memory[rt+Iimmi+3]=(REGIST.value[rt]>>24)&0xFF;
                break;
            case 4://BEQ
                if(REGIST.value[rs]==REGIST.value[rt]){
                    RAM.PC+=(Iimmi<<2)-4;
                }
                break;
            case 2://J
                RAM.PC=(RAM.PC & 0xF0000000 | Jimmi)-4;
                break;
            default:
                console.error("Instruction Error!");
                break;
        }
        RAM.PC+=4;
        pointer.style.top=deComTop+4+20*RAM.PC/4+"px";
        if(RAM.PC>=RAM.maxPC){
            pointer.style.display="none";
            return alert("Run completed!");
        }
    }
};