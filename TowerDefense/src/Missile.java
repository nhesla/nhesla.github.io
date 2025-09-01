import java.awt.*;
import java.util.Random;

public class Missile extends Thing
{
    int target;
    int targetX;
    int targetY;
    int direction;
    int explosion;
    
    public Missile(int x, int y, int t, int d) 
    {
    	super(x,y,d);
    	target = t;
    	targetX = 0;
    	targetY = 0;
    	direction = 0;
    	explosion = -1;
    }
    
    public Missile(Missile copy, int d)
    {
    	super(copy.getX(), copy.getY(), d);
    	target = copy.getTarget();
    	targetX = copy.getTX();
    	targetY = copy.getTY();
    	direction = copy.getD();
    	explosion = copy.getE();
    }
    
    public int getTarget()
    {
    	return target;
    }
    
    public int getTX()
    {
    	return targetX;
    }
    
    public int getTY()
    {
    	return targetY;
    }
    
    public int getD()
    {
    	return direction;
    }
    
    public int getE()
    {
    	return explosion;
    }
    
    public void attack(Creep creep)
    {
	    if(explosion < 0)
	    {
	    	double a = creep.getX() - getX();
	    	double b = creep.getY() - getY();
	    	double c = Math.hypot(a,b);
			if (c < 1e-6) return; // Prevent near-zero instability
	    	
	    	targetX = creep.getX();
	    	targetY = creep.getY();
	    	
	    	direction = (int)Math.toDegrees(a/c);
	    	
	    	int timesX = 1, timesY = 1;
	    	
	    	if(creep.getX() - getX() < 0)
	    		timesX = -1;
	    		
	    	if(creep.getY() - getY() < 0)
	    		timesY = -1;
	    	
	    	setX((int) Math.min(Math.abs(15*(a/c)),Math.abs(creep.getX() - getX()))*timesX);
	    	setY((int) Math.min(Math.abs(15*(b/c)),Math.abs(creep.getY() - getY()))*timesY);	
	    		
	    	a = creep.getX() - getX();
	    	b = creep.getY() - getY();
	    	c = Math.hypot(a,b);
	    	
	    	if(c <= (5/diviser))
	    	{
	    		explosion = 3;
	    	}
	    }
	    else if(explosion > 0)
	    {
	    	explosion --;
	    }
    }
    
    public void drawMissile(Graphics g)
    {
		double vector = direction * Math.PI*2 / 360.0;
		
		double b = getX()-targetX;
		double a = getY()-targetY;
		double c = Math.hypot(a,b);
		if (c < 1e-6)
			return; // Prevent near-zero instability
		
		if(explosion < 0)
    	{
			Polygon rpg = new Polygon();
			rpg.addPoint((int)(getX()+(0/diviser)*a/c-(0/diviser)*-b/c),(int)(getY()+(0/diviser)*a/c+(0/diviser)*-b/c));
			rpg.addPoint((int)(getX()+(4/diviser)*a/c+(6/diviser)*-b/c),(int)(getY()-(6/diviser)*a/c+(4/diviser)*-b/c));
			rpg.addPoint((int)(getX()+(4/diviser)*a/c+(16/diviser)*-b/c),(int)(getY()-(16/diviser)*a/c+(4/diviser)*-b/c));
			rpg.addPoint((int)(getX()-(4/diviser)*a/c+(16/diviser)*-b/c),(int)(getY()-(16/diviser)*a/c-(4/diviser)*-b/c));
			rpg.addPoint((int)(getX()-(4/diviser)*a/c+(6/diviser)*-b/c),(int)(getY()-(6/diviser)*a/c-(4/diviser)*-b/c));
			rpg.addPoint((int)(getX()+(0/diviser)*a/c-(0/diviser)*-b/c),(int)(getY()+(0/diviser)*a/c+(0/diviser)*-b/c));
			
			g.setColor(Color.lightGray);
			g.fillPolygon(rpg);
			
			g.setColor(Color.yellow);
			g.fillArc((int)(((getX()-16/diviser)-(20/diviser)*-b/c)-(0/diviser)*a/c),(int)(((getY()-20/diviser)-(0/diviser)*-b/c)+(20/diviser)*a/c),(32/diviser),(32/diviser),80-direction,60);
					
			g.setColor(Color.orange);
			g.fillArc((int)(((getX()-12/diviser)-(20/diviser)*-b/c)-(0/diviser)*a/c),(int)(((getY()-20/diviser)-(0/diviser)*-b/c)+(20/diviser)*a/c),(24/diviser),(24/diviser),80-direction,60);
    	}
    	else
    	{
    		///explosion
    		Random randy = new Random();
    		
    		Polygon boom = new Polygon();
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(0))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(0))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(15))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(15))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(30))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(30))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(45))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(45))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(60))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(60))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(75))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(75))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(90))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(90))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(105))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(105))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(120))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(120))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(135))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(135))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(150))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(150))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(165))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(165))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(180))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(180))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(195))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(195))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(210))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(210))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(225))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(225))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(240))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(240))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(255))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(255))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(270))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(270))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(285))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(285))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(300))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(300))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(315))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(315))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(330))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(330))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(345))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(345))));
			boom.addPoint((int)(getX()+((randy.nextInt(50)+100)/diviser*Math.sin(360))),(int)(getY()+((randy.nextInt(50)+100)/diviser*Math.cos(360))));
			
			g.setColor(Color.red);
			g.fillPolygon(boom);
    	}
    }
}