class Circle{
    constructor(canvas_widght, canvas_height, innerRadius, outerRadius, speed=4){
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;

        let minWidth = 0 + innerRadius;
        let maxWidth = canvas_widght - innerRadius;
        let minHeight = 0 + innerRadius;
        let maxHeight = canvas_height - innerRadius;
        let x = Math.random() * (maxWidth - minWidth) + minWidth;
        let y = Math.random() * (maxHeight - minHeight) + minHeight;
        this.position = createVector(x,y);

        this.velocity = p5.Vector.random2D().setMag(speed);
    }

    show(){
        circle(this.position.x, this.position.y, this.innerRadius);
    }
}

export {Circle}