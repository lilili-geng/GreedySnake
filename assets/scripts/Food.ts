import { _decorator, Color, Component, Node, Prefab, Sprite, UITransform, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Food')
export class Food extends Component {

    start() {
        this.node.getComponent(Sprite).color = this.randomColor()
        this.node.setPosition(this.randomPos())
    }

    update(deltaTime: number) {

    }

    randomColor() {
        let R = Math.round(Math.random() * 255)
        let G = Math.round(Math.random() * 255)
        let B = Math.round(Math.random() * 255)
        return new Color(R, G, B)
    }

    // 初始化贪吃蛇随机位置
    randomPos() {
        let width = this.node.parent.getComponent(UITransform).contentSize.width
        let height = this.node.parent.getComponent(UITransform).contentSize.height
        let x = Math.round(Math.random() * width) - width / 2
        let y = Math.round(Math.random() * height) - height / 2
        return v3(x, y, 0)
    }
}

