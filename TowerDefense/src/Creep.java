import java.awt.*;   
import java.applet.Applet;
import java.util.Random; 

public class Creep extends Thing
{
	protected int maxHealth;
	protected int health;
	protected int speed;
	protected int frozen;
	protected int burned;
	protected boolean hurt;
	protected int animation;
	protected int animate;
	protected int direction;
	protected int checkPoint;
	protected boolean visible;
	protected boolean goal;

    public Creep(int x, int y, int h, int s, int d) 
    {
		super(x, y, d);
		
    	maxHealth = h;
    	health = h;
    	speed = s;
    	frozen = 0;
    	burned = 0;
    	hurt = false;
    	animation = 0;
    	animate = 1;
    	direction = 0;
    	checkPoint = 0;
    	visible = true;
    	goal = false;
	}	
    public Creep(Creep copy, int d)
    {
    	super(copy.getX(), copy.getY(), d);
    	maxHealth = copy.getM();
    	health = copy.getH();
    	speed = copy.getS();
    	frozen = copy.getF();
    	burned = copy.getB();
    	hurt = copy.getR();
    	animation = copy.getA();
    	animate = copy.getN();
    	direction = copy.getD();
    	checkPoint = copy.getC();
    	visible = copy.getV();
    	goal = copy.getG();
    }
    public Creep(int x, int y, int h, int s, int c, int d)
    {
    	super(x, y, d);
    	maxHealth = h;
    	health = h;
    	speed = s;
    	frozen = 0;
    	burned = 0;
    	hurt = false;
    	animation = 0;
    	animate = 1;
    	direction = 0;
    	checkPoint = c;
    	visible = true;
    	goal = false;
    }
  	
    public int getM()
    {
    	return maxHealth;
    }
    public int getH()
    {
    	return health;
    }
    public int getS()
    {
    	return speed;
    }
    public int getF()
    {
    	return frozen;
    }
    public int getB()
    {
    	return burned;
    }
    public boolean getR()
    {
    	return hurt;
    }
    public int getA()
    {
    	return animation;
    }
    public int getN()
    {
    	return animate;
    }
    public int getD()
    {
    	return direction;
    }
    public int getC()
    {
    	return checkPoint;
    }
    public void setC()
    {
    	checkPoint = 0;
    }
    public boolean getV()
    {
    	return visible;
    }
    public void setV()
    {
    	visible = true;
    }
    public void setNV()
    {
    	visible = false;
    }
    public boolean getG()
    {
    	return goal;
    }
    
    public void setC(int n)
    {
    	checkPoint = n;
    }
    
    public void takeDamage(int n)
    {
    	health -= n;
    	hurt = true;
    }
    public void freeze(int n)
    {
    	frozen += n;
    	hurt = true;
    }
    public void burn(int n)
    {
    	burned += n;
    	hurt = true;
    }
    public void shock(int n)
    {
    	health -= (int)((double)(health * n)/100);
    	hurt = true;
    }
    
    public void run(int checkX, int checkY)
    {
		if(health > 0)
		{
	    	double a = checkX - getX();
	    	double b = checkY - getY();
	    	double c = Math.hypot(a,b);
	    	
	    	direction = (int)Math.toDegrees(a/c);
	    	
	    	int timesX = 1, timesY = 1;
	    	
	    	if(checkX-getX() < 0)
	    		timesX = -1;
	    		
	    	if(checkY-getY() < 0)
	    		timesY = -1;
	    	
	    	if(frozen % 2 == 0)
	    	{
	    		setX((int) Math.min(Math.abs(speed*(a/c)),Math.abs(checkX - getX()))*timesX);
	    		setY((int) Math.min(Math.abs(speed*(b/c)),Math.abs(checkY - getY()))*timesY);
	    	}
	    	
	    	if(frozen > 0)
	    		frozen --;
	    		
	    	if(burned % 2 == 1)
	    		takeDamage(1);
	    		
	    	if(burned > 0)
	    		burned --;
	    	
	    	if(getX() == checkX && getY() == checkY && checkPoint != 19)
	    		checkPoint ++;
	    		 
	    	if(getX() == checkX && getY() == checkY && checkPoint == 19)
	    	{
	    		health = 0;
	    		animation = 0;
	    		goal = true;
	    	}
    	}		
    }
    
    public void drawCreep(Graphics g)
    {
	    if(health > 0) 
	    {
	    	if(hurt)
	    	{
	    		g.setColor(Color.gray);
	    		hurt = !hurt;
	    	}	
	    	else if(burned > 0)
	    		g.setColor(Color.orange);
	    	else if(frozen > 0)
	    		g.setColor(Color.cyan);
	    	else
	    		g.setColor(Color.yellow);
	    		
	    	if(visible)
	    		g.fillArc(getX()-(20/diviser), getY()-(20/diviser), (40/diviser), (40/diviser), (0+animation)-direction, (360-animation*2));
	    	
	    	g.setColor(Color.black);
	    	g.drawArc(getX()-(20/diviser), getY()-(20/diviser), (40/diviser), (40/diviser), (0+animation)-direction, (360-animation*2));
	    	
	    	g.setColor(Color.green);
	    	g.setFont(new Font("Courier", Font.BOLD, (18/diviser)));
	        g.drawString(""+health,getX()-(10/diviser),getY()-(20/diviser));
	    	
	    	if(animation >= 30)
	    		animate = -1;
	    	
	    	if(animation <= -0)
	    		animate = 1;
	    		
	    	animation += animate*10;
	    }
	    else
	    {
	    	if(animation >= 0)
			{
				g.setColor(Color.gray);
				g.fillArc(getX()-(20/diviser), getY()-(20/diviser), (40/diviser), (40/diviser), 90+(180-animation*15), 360-(360-animation*30));
		    	
		    	animation --;
			}
	    }
    }
}