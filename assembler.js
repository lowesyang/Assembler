var compileBtn=document.getElementsByClassName("compile")[0];
var orderRes=document.getElementsByClassName("orderRes")[0];
var runBtn=document.getElementsByClassName("run")[0];
var input=document.getElementById("input");
var mcCodeRes=document.getElementsByClassName("mcCode")[0];
var deCompRes=document.getElementsByClassName("deComp")[0];
var clearBtn=document.getElementById("clearBtn");
var regBtn=document.getElementsByClassName("submitReg")[0];
var regInput=document.getElementsByClassName("register");
var pointer=document.getElementsByClassName("pointer")[0];

//--------寄存器类--------
var REGIST={
    map:[],
    value:[],
    isWatch:0,
    Register:["$zero", "$at", "$v0", "$v1", "$a0", "$a1", "$a2", "$a3", "$t0",
        "$t1", "$t2","$t3","$t4","$t5","$t6","$t7","$s0","$s1","$s2","$s3","$s4","$s5","$s6",
        "$s7","$t8","$t9","$k0","$k1","$gp","$sp","$fp","$ra","$pc","$hi","lo"],
    init:function(){
        REGIST.map=[];
        REGIST.value=[];
        for(var i in REGIST.Register){
            REGIST.map[REGIST.Register[i]]=i;
        }
        clearInterval(REGIST.isWatch);
        REGIST.isWatch=0;
    },
    saveDefault:function(){
        for(var i=0;i< regInput.length;i++){
            if(regInput[i].value=="") regInput[i].value=0;
            REGIST.value[i]=parseInt(regInput[i].value);
            regInput[i].setAttribute("readonly","true");
            regInput[i].className+=" readonly";
        }
    },
    watchReg:function(){
        clearInterval(REGIST.isWatch);
        REGIST.isWatch=setInterval(function(){
            for(var i=0;i< regInput.length;i++){
                regInput[i].value=parseInt(REGIST.value[i]);
            }
        },100);
    }
};

//--------内存类--------
var RAM={
    state:0,
    Memory:[],
    maxPC:0,
    PC:0,
    base:0,
    process:[],
    instruct:[],
    init:function(){
        var buffer=new ArrayBuffer(65536);//模拟内存空间，共65536bits
        var memory=new Uint8Array(buffer);//分配内存块，每个内存块8bits
        RAM.Memory=memory;
        RAM.maxPC=RAM.base=RAM.PC=0;
        RAM.process=[];
        RAM.state=1;
        RAM.instruct=[];
    }
};

//--------编译器类--------
var ASSEM={
    isLoop:0,
    begin:0,
    Run:function(){
        REGIST.init();
        RAM.init();
        ASSEM.begin=ASSEM.isLoop=0;
    },

    //--------MIPS指令集的三种类型
    RType:function(op,rd,rs,rt){
        var funcode=rd<<11|rs<<21|rt<<16|op;
        return funcode;
    },
    IType:function(op,rs,rt,immi){
        var funcode=rt<<16|rs<<21|op<<26|immi;
        return funcode;
    },
    JType:function(op,target){
        var funcode=op<<26|target;
        return funcode;
    },

    //--------输出特定位数(64,32,16,8)的二进制串
    getBinary:function(num,bit){
        var binaryStr="";
        for(var i=0;i<bit;i++){
            var tmp=(num>>i) & 1;
            binaryStr+=tmp.toString();
        }
        binaryStr=binaryStr.split("").reverse().join("");
        return binaryStr;
    },
    //--------汇编指令编译为机器码
    getMcCode:function(order){
        var op, rd, rs, rt, opstr,res,immi;
        opstr = order[0].toLowerCase();
        rd = REGIST.map[order[1]];

        if (opstr == "add" || opstr=="sub") {
            if(opstr=="add") op = 1 << 5;
            else op=1<<5|1<<1;
            rs = REGIST.map[order[2]];
            rt = REGIST.map[order[3]];
            res = ASSEM.RType(op, rd, rs, rt);
            //console.log(getBinary(res));
        }

        if (opstr == "lw" || opstr == "sw") {
            if (opstr == "lw") op = 1 << 5 | 1 << 1 | 1;
            else op = 1 << 5 | 1 << 3 | 1 << 1 | 1;
            immi = order[2];
            rs = REGIST.map[order[3]];
            res = ASSEM.IType(op, rs, rd, immi);
            //console.log(getBinary(res));
        }

        if (opstr == "beq") {
            op = 1 << 2;
            var label = order[3];
            immi=RAM.process[label]-RAM.maxPC/4;
            rt = REGIST.map[order[2]];
            res = ASSEM.IType(op, rd, rt, immi);
            //console.log(getBinary(res));
        }

        if (opstr == "j") {
            op = 1 << 1;
            var target = order[1];
            if(REGIST.Register.indexOf(target)!=-1) immi=REGIST.map[target];
            else immi=RAM.process[target];
            res = ASSEM.JType(op, immi);
            //console.log(getBinary(res));
        }

        return ASSEM.getBinary(res,32);
    },

    //--------编译--------
    compiler:function(){
        REGIST.watchReg();
        REGIST.saveDefault();
        mcCodeRes.innerHTML="";
        var instruct=input.value.split("\n");
        var singleInst=[];
        for(var i in instruct){
            instruct[i]=instruct[i].trim();
            if(instruct[i]=="") continue;
            var order = instruct[i].split(/\s+|\,|\(|\)|:/);
            for(var j in order){
                if(!order[j]) order.splice(j,1);
            }
            var opstr=order[0].toLowerCase();
            if(opstr!="add" && opstr!="sub" && opstr!="lw" && opstr!="sw" && opstr!="beq" && opstr!="j"){
                opstr=opstr.substring(0,opstr.length);
                RAM.process[opstr]=i;
                order.splice(0,1);
            }
            singleInst.push(order);
        }
        //console.log(singleInst);
        for(var i in singleInst) {
            var machineCode=ASSEM.getMcCode(singleInst[i]);
            var high=machineCode.substring(0,8),
                highMid=machineCode.substring(8,16),
                lowMid=machineCode.substring(16,24),
                low=machineCode.substring(24,32);
            RAM.Memory[RAM.maxPC]=parseInt(low,2);
            RAM.Memory[RAM.maxPC+1]=parseInt(lowMid,2);
            RAM.Memory[RAM.maxPC+2]=parseInt(highMid,2);
            RAM.Memory[RAM.maxPC+3]=parseInt(high,2);
            RAM.maxPC+=4;
            //console.log(machineCode);
            mcCodeRes.innerHTML+=machineCode+"<br>"
        }
        //console.log(RAM.Memory);
        ASSEM.decompiler();
    },

    //--------执行--------
    runPro:function(){
        var rflag=true;
        ASSEM.Run();
        ASSEM.compiler();
        while(RAM.PC < RAM.maxPC && rflag){
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
                    RAM.Memory[rs+Iimmi+0]=(REGIST.value[rt])&0xFF;
                    RAM.Memory[rs+Iimmi+1]=(REGIST.value[rt]>>8)&0xFF;
                    RAM.Memory[rs+Iimmi+2]=(REGIST.value[rt]>>16)&0xFF;
                    RAM.Memory[rs+Iimmi+3]=(REGIST.value[rt]>>24)&0xFF;
                    break;
                case 4://BEQ
                    if(REGIST.value[rs]==REGIST.value[rt]){
                        RAM.PC+=(Iimmi<<2)-4;
                    }
                    break;
                case 2://J
                    RAM.PC=(RAM.PC&0xF0000000 | Jimmi)-4;
                    break;
                default:
                    console.error("Instruction Error!");
                    rflag=false;
                    break;
            }
            //console.log(instruct[i]);
            //deCompRes.innerHTML+=instruct[i]+"<br>";
            RAM.PC+=4;
            ASSEM.isLoop++;
            if(ASSEM.isLoop>=10000000) return alert("Trapped in loop!Error!");
        }
        alert("run completed!");
    },

    //--------反编译--------
    decompiler:function(){
        deCompRes.innerHTML="";
        var instruct=[];
        for (var i=0;i<RAM.maxPC;i+=4){
            var IR,op,rs,rt,rd,fun,Iimmi,Jimmi;
            IR=(RAM.Memory[i])|(RAM.Memory[i+1]<<8)|(RAM.Memory[i+2]<<16)|(RAM.Memory[i+3]<<24);
            op=(IR>>26)&63;
            rs=(IR>>21)&31;
            rt=(IR>>16)&31;
            rd=(IR>>11)&31;
            fun=IR&63;
            Iimmi=IR&0xFFFF;
            Jimmi=(IR&0x3FFFFFF);

            switch(op){
                case 0://R-type
                    switch(fun){
                        case 32://ADD
                            instruct[i]="ADD ";
                            instruct[i]+=REGIST.Register[rd]+","+REGIST.Register[rs]+","+REGIST.Register[rt];
                            break;
                        case 34://SUB
                            instruct[i]="SUB ";
                            instruct[i]+=REGIST.Register[rd]+","+REGIST.Register[rs]+","+REGIST.Register[rt];
                            break;
                    }
                    break;
                case 35://LW
                    instruct[i]="LW ";
                    instruct[i]+=REGIST.Register[rt]+","+Iimmi+"("+REGIST.Register[rs]+")";
                    break;
                case 43://SW
                    instruct[i]="SW ";
                    instruct[i]+=REGIST.Register[rt]+","+Iimmi+"("+REGIST.Register[rs]+")";
                    break;
                case 4://BEQ
                    instruct[i]="BEQ ";
                    instruct[i]+=REGIST.Register[rs]+","+REGIST.Register[rt]+","+Iimmi;
                    break;
                case 2://J
                    instruct[i]="J ";
                    instruct[i]+=Jimmi;
                    break;
                default:
                    console.error("Instruction Error!");
                    break;
            }
            //console.log(instruct[i]);
            deCompRes.innerHTML+=instruct[i]+"<br>";
        }
        RAM.instruct=instruct;
    }
};


compileBtn.addEventListener("click",ASSEM.compiler);
runBtn.addEventListener("click",ASSEM.runPro);
regBtn.addEventListener("click",function(){
    if(REGIST.isWatch) return alert("已保存");
    REGIST.saveDefault();
    alert("保存成功!")
});

clearBtn.addEventListener("click",function(){
    mcCodeRes.innerHTML="";
    deCompRes.innerHTML="";
    orderRes.innerHTML="";
    pointer.style.display="none";
    for(var i=0;i< regInput.length;i++){
        regInput[i].removeAttribute("readonly");
        regInput[i].className="register";
        regInput[i].value=0;
    }
    clearInterval(REGIST.isWatch);
    REGIST.isWatch=0;
    ASSEM.Run();
});

ASSEM.Run();