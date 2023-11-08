### Workflow
``` mermaid
flowchart TD
    A1[Request] --> Pg1{Index Page}
    Pg1 --> fn1((Express Router))
    fn1 --> |Route based on path| Pg2{Controller Page}
    Pg2 --> var1

    subgraph user authentication check
    var1(valid token?)
    var1 --> |No| err1(Err Msg: Not authorised)
    var1 --> |Yes| var3(user exist?)
    var3 --> |No| err2(Err Msg: Not authorised)
    end

    subgraph user authorisation check
    var3 --> |Yes, check authorised usergroup of taskowner for the task state|var4(authorised usergroup)
    var4 --> |get usergroup of user and check if is authorised usergroup|var5(user is from authorised usergroup?)
    var5 --> |No| err3(Err Msg:Not Permitted)
    end

    subgraph params validation
    var5 --> |check all provided and etc.|var6(is params valid)
    var6 --> |fail| err4(Err msg:Invalid Request due to missing parameters)
    end

    subgraph sql transaction
    var6 --> |success| sql((SQL Query))
    sql --> |success| var7(return res)
    sql --> |fail| err5(Err Msg: Database transaction/connection error)
    end
    ```