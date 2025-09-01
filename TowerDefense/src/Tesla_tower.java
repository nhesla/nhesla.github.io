import java.awt.*; 
import java.applet.Applet;  
import java.util.Random; 
 
public class Tesla_tower extends Tower 
{
	public Tesla_tower(int x, int y, int d)
	{
		super(x,y,d);
	}
	public Tesla_tower(Tower copy, int d)
	{
		super(copy,d);
	}
	
	public int getDamage(int boost)
	{
		switch(damage+boost)
		{
			case 1:
				return 18;
			case 2:
				return 21;
			case 3:
				return 24;
			case 4:
				return 27;
			case 5:
				return 30;
			case 6:
				return 33;
			case 7:
				return 36;
			case 8:
				return 39;
		}
		return 0;
	}
	
	public int getRange(int boost)
	{
		switch(range+boost)
		{
			case 1:
				return 150;
			case 2:
				return 200;
			case 3:
				return 250;
			case 4:
				return 300;
			case 5:
				return 350;
			case 6:
				return 400;
			case 7:
				return 450;
			case 8:
				return 500;
		}
		return 0;
	}
	
	public int getRate(int boost)
	{
		switch(rate+boost)
		{
			case 1:
				return 40;
			case 2:
				return 37;
			case 3:
				return 34;
			case 4:
				return 31;
			case 5:
				return 28;
			case 6:
				return 25;
			case 7:
				return 22;
			case 8:
				return 19;		
		}
		return 0;
	}
	
	public int getUpD()
	{
		int num=0;
		
		if(damage < 5)	
			for(int count=0; count < damage; count ++)
			{
				num += count+1;
			}
		
		return num*600;
	}
	public int getUpR()
	{
		int num=0;
		
		if(range < 5)
			for(int count=0; count < range; count ++)
			{
				num += count+1;
			}
		
		return num*600;
	}
	public int getUpT()
	{
		int num=0;
		
		if(rate < 5)	
			for(int count=0; count < rate; count ++)
			{
				num += count+1;
			}
		
		return num*600;
	}
	
	public int getUpS()
	{
		int num=0;
		
		for(int count=0; count < rate; count ++)
		{
			num += count+1;
		}
		for(int count=0; count < range; count ++)
		{
			num += count+1;
		}
		for(int count=0; count < rate; count ++)
		{
			num += count+1;
		} 
		
		return num*600/3;
	}
	
	public void Attack(Creep[] creep, int enemies)
	{
		for(int count=0; count < enemies; count ++)
		{
			if(creep[count].getV() && creep[count].getH() > 0)
			{
				double a = creep[count].getX()-getX();
			    double b = creep[count].getY()-getY();
			    double c = Math.hypot(a,b);
			    	
			    if(c <= (getRange(boostedR)/2)/diviser && reload == 0)
			    {
			    	reload += getRate(boostedT);
			    	target = count;
			    	creep[count].shock(getDamage(boostedD));
			    }
			    
			    if(c <= (getRange(boostedR)/2)/diviser && count == target)
			    {
			    	targetX = creep[count].getX();
			    	targetY = creep[count].getY();
			    	if(b>0)
			    		angle = (int) Math.toDegrees(Math.asin(a/c));
			    	if(a>0)
			    		angle = (int) Math.toDegrees(Math.acos(b/c));
			    	else
			    		angle = (int) Math.toDegrees(Math.atan(a/b));
			    }
			}
		}
		
		if(reload > 0)
			reload --;
		else
			target = -1;
	}
	
	public void drawTower(Graphics g)
	{
	    //Tesla animation:
	    Random randy = new Random();
	    
	    g.setColor(Color.darkGray);
	    g.fillOval(getX()-(18/diviser),getY()-(18/diviser),(36/diviser),(36/diviser));
	    
	    g.setColor(Color.white);
	    g.drawOval(getX()-(18/diviser),getY()-(18/diviser),(36/diviser),(36/diviser));
	    
	    for(int count2 = 0; count2 < 3; count2 ++)
	    {
	     	int xrand = (randy.nextInt(20)-10)/diviser+getX();
	       	int yrand = (randy.nextInt(20)-10)/diviser+getY();
	        	
	       	if(randy.nextInt(2) == 0)
	       		g.setColor(Color.yellow);
	   		else
	   			g.setColor(Color.cyan);
	        		
	        int a = (randy.nextInt(15)-7)+xrand-getX();
		    int b = (randy.nextInt(15)-7)+yrand-getY();
		    int c = (int) Math.sqrt(Math.pow(Math.abs(a),2) + Math.pow(Math.abs(b),2));
	        if(c == 18/diviser)
	   		{
				g.drawLine(getX(),getY(),xrand,yrand);
		   		g.drawLine(xrand,yrand,(randy.nextInt(20)-10)/diviser+xrand,(randy.nextInt(20)-10)/diviser+yrand);
	      	}
	       	else
	       		count2 --;
		}	
			
		/////lightning strike//////
		double vector = angle * Math.PI*2 / 360.0;
		
		if(reload >= getRate(boostedT)-5)
		{
			if(randy.nextInt(2) == 0)
				g.setColor(Color.yellow);
			else
				g.setColor(Color.cyan);
				
			double b = getX()-targetX;
		    double a = getY()-targetY;
		    double c = Math.hypot(a,b);
				
			int arc1x = (int)(getX()+(c/3)*-b/c+randy.nextInt(30)-15);
			int arc1y = (int)(getY()-(c/3)*a/c+randy.nextInt(30)-15);
			int arc2x = (int)(arc1x+(c/3)*-b/c+randy.nextInt(30)-15);
			int arc2y = (int)(arc1y-(c/3)*a/c+randy.nextInt(30)-15);	
			
			g.drawLine((int)(getX()+(18/diviser)*-b/c), (int)(getY()-(18/diviser)*a/c),arc1x, arc1y);
			g.drawLine(arc1x, arc1y ,arc2x, arc2y);
			g.drawLine(arc2x, arc2y, targetX, targetY);
		}
	}
}
