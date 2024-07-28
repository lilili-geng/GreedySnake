import { _decorator, CCFloat, CCInteger, Component, Prefab, Node, UITransform, v3, instantiate, Vec3, v2, Collider2D, Contact2DType, director, RichText, Label, Color, CCBoolean } from 'cc';
import { Joystick } from './Joystick';

const { ccclass, property } = _decorator;

@ccclass('Head')
export class Head extends Component {

    @property(Prefab)
    public bodyPrefab: Prefab = null;

    @property(Prefab)
    public foodPrefab: Prefab = null;

    @property([Node])
    public bodyArray: Node[] = [];

    @property(CCInteger)
    public bodyNum: number = 2;

    @property(CCFloat)
    public bodyDistance: number = 50;

    public speed: number = 200;

    @property(Vec3)
    public snakDir: Vec3 = v3(0, 0, 0);

    @property(Node)
    public joystick: Node = null;

    previousMoveDir: Vec3;

    @property(CCInteger) // Changed from Number to CCInteger
    score: number = 0;

    @property(RichText)
    public textScore: RichText = null;

    @property(Node)
    public startPanel: Node = null;

    @property(Node)
    public gameOverPanel: Node = null;

    @property(Node)
    public expedite: Node = null; // 加速按钮

    // 标志变量来检查按钮是否被按下
    private isExpediting: boolean = false;

    // 添加控制游戏开始的标志
    public isGameStarted: boolean = false

    protected onLoad(): void {
        if (this.node) {
            this.bodyArray = this.bodyArray.filter(node => node !== null); // 清除所有为 null 的节点
            this.bodyArray.push(this.node); // 确保蛇头节点已添加
            this.rotateHead(this.node.position);
            this.previousMoveDir = this.node.position.clone().normalize();

            // 创建蛇身体
            for (let i = 1; i <= this.bodyNum; i++) {
                this.getNewBody();
            }

            // 确保蛇头在随机位置
            this.node.setPosition(this.randomPos());
            this.joystick.active = false
            this.expedite.active = false

            console.log("OnLoad: Body Array Initialized", this.bodyArray);
        } else {
            console.error("Head node is not available");
        }
    }

    start() {
        if (this.node.parent) {

            if (!director.isPaused()) {
                director.resume()
            }

            this.schedule(() => {
                this.moveBody();
            }, 0.2);

            this.node.parent.addChild(instantiate(this.foodPrefab));
            let collider = this.node.getComponent(Collider2D);
            if (collider) {
                collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            } else {
                console.error("Collider2D component is missing");
            }
        } else {
            console.error("Node's parent is null in start method");
        }
    }

    update(deltaTime: number) {
        if (!this.isGameStarted) {
            return;
        }

        if (!this.node.parent) {
            console.error("Node's parent is null");
            return;
        }

        if (!this.joystick) {
            console.error("Joystick is not assigned");
            return;
        }

        let joystickComponent = this.joystick.getComponent(Joystick);
        if (joystickComponent) {
            this.snakDir = joystickComponent.dir.normalize();
            if (this.snakDir.length() === 0) {
                this.snakDir = this.previousMoveDir;
            } else {
                this.previousMoveDir = this.snakDir;
            }
            let newPos = this.node.position.clone().add(this.snakDir.clone().multiplyScalar(this.speed * deltaTime));
            this.node.angle = joystickComponent.calculateAngle() - 90;
            this.node.setPosition(newPos);
        } else {
            console.error("Joystick component is missing");
        }
    }

    getNewBody() {
        if (!this.node.parent) {
            console.error("Node's parent is null in getNewBody method");
            return;
        }

        let newBody = instantiate(this.bodyPrefab);
        if (!newBody) {
            console.error("Failed to instantiate bodyPrefab.");
            return;
        }

        // 确保 bodyArray 中的所有节点都有效
        if (this.bodyArray.length === 1) {
            let dir = this.node.position.clone().normalize();
            newBody.setPosition(this.node.position.clone().subtract(dir.multiplyScalar(this.bodyDistance)));
        } else if (this.bodyArray.length >= 2) {
            let lastBody = this.bodyArray[this.bodyArray.length - 1];
            let secondLastBody = this.bodyArray[this.bodyArray.length - 2];

            // 如果节点为 null，则创建新的节点替换
            if (!lastBody) {
                lastBody = instantiate(this.bodyPrefab);
                this.node.parent.addChild(lastBody);
                this.bodyArray[this.bodyArray.length - 1] = lastBody;
            }
            if (!secondLastBody) {
                secondLastBody = instantiate(this.bodyPrefab);
                this.node.parent.addChild(secondLastBody);
                this.bodyArray[this.bodyArray.length - 2] = secondLastBody;
            }

            let dir = secondLastBody.position.clone().subtract(lastBody.position).normalize();
            newBody.setPosition(lastBody.position.clone().subtract(dir.multiplyScalar(this.bodyDistance)));
        } else {
            console.error("Not enough body segments to initialize new body.");
            return;
        }

        if (this.node.parent) {
            this.node.parent.addChild(newBody);
            this.bodyArray.push(newBody);
            this.changeZindex();
        } else {
            console.error("Node's parent is null in getNewBody method");
        }
    }

    rotateHead(headPos: Vec3) {
        let angle = v2(1, 0).signAngle(v2(headPos.x, headPos.y)) * 180 / Math.PI;
        this.node.angle = angle - 90;
    }

    moveBody() {

        if (this.bodyArray.length === 0) {
            console.error("Body array is empty.");
            return;
        }

        let headPos = this.node.position;
        for (let i = this.bodyArray.length - 2; i >= 0; i--) {
            if (!this.bodyArray[i] || !this.bodyArray[i + 1]) {
                console.error("One or more body nodes are null.");
                return;
            }
            this.bodyArray[i + 1].position = this.bodyArray[i].position;
        }
        this.bodyArray[0].position = headPos;
    }

    randomPos(): Vec3 {
        if (!this.node.parent) {
            console.error("Node's parent is null in randomPos method");
            return v3(0, 0, 0);
        }

        let width = this.node.parent.getComponent(UITransform).contentSize.width;
        let height = this.node.parent.getComponent(UITransform).contentSize.height;
        let x = Math.round(Math.random() * (width - this.bodyDistance)) - width / 2;
        let y = Math.round(Math.random() * (height - this.bodyDistance)) - height / 2;

        console.log(`Random position: (${x}, ${y})`);

        return v3(x, y, 0);
    }

    changeZindex() {
        if (!this.node.parent) {
            console.error("Node's parent is null in changeZindex method");
            return;
        }

        let lastIndex = this.node.parent.children.length - 1;
        for (let i = 0; i < this.bodyArray.length - 1; i++) {
            if (this.bodyArray[i]) {
                this.bodyArray[i].setSiblingIndex(lastIndex - i);
            } else {
                console.error(`Body node at index ${i} is null.`);
            }
        }
    }


    playGame() {
        if (director.isPaused) {
            director.resume();
        }
        this.isGameStarted = true; // 游戏开始
        this.joystick.active = true
        this.expedite.active = true
        this.startPanel.active = false;
    }

    restartGame() {
        director.resume();
        director.loadScene("scene1");
    }

    onExpediteStart() {
        this.isExpediting = true;
        this.speed += 50; // 加速
        console.log("Accelerating: Speed increased to", this.speed);
    }

    onExpediteEnd() {
        if (this.isExpediting) {
            this.isExpediting = false;
            this.speed = 200; // 恢复原速
            console.log("Speed restored to", this.speed);
        }
    }

    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D) {
        console.log('onBeginContact');
        if (otherCollider.group === 4) {
            otherCollider.node.removeFromParent();
            this.score++;
            // 右上角得分
            this.textScore.string = this.score.toString();
            this.textScore.fontColor = new Color(0, 0, 0)
            this.node.parent.addChild(instantiate(this.foodPrefab));
            this.getNewBody();
        }

        if (otherCollider.group === 8) {
            this.gameOverPanel.active = true;
            this.gameOverPanel.getChildByName("Text_score").getComponent(Label).string = `得分${this.score.toString()}`;
            director.pause();
        }
    }


}
